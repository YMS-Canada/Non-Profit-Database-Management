from django.shortcuts import redirect
from django.db import connection, transaction
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
from .auth_views import get_current_user, require_role, require_login


# ---------- HTML DELETE Views ----------

def delete_user(request, user_id):
    """DELETE: Deactivate a user account (ADMIN only)"""
    if not require_role(request, 'ADMIN'):
        return redirect('login')
    
    current_user_id, _, _ = get_current_user(request)
    
    if current_user_id == user_id:
        messages.error(request, "You cannot deactivate your own account.")
        return redirect('admin_dashboard')
    
    with connection.cursor() as cur:
        cur.execute("""
            UPDATE users 
            SET is_active = FALSE 
            WHERE user_id = %s
        """, [user_id])
    
    messages.success(request, f"User #{user_id} has been deactivated.")
    return redirect('admin_dashboard')


def delete_budget_request(request, request_id):
    """
    DELETE budget request (HTML endpoint)
    TREASURER ONLY - can delete PENDING or REJECTED requests they own
    """
    if not require_login(request):
        return redirect('login')
    
    user_id, role, city_id = get_current_user(request)
    
    # Only treasurers can delete their own requests
    if role != 'TREASURER':
        messages.error(request, "Only treasurers can delete budget requests.")
        return redirect('budget_request_list')
    
    with connection.cursor() as cur:
        # Check if request exists and belongs to user
        cur.execute("""
            SELECT status, requester_id FROM budget_request WHERE request_id = %s;
        """, [request_id])
        result = cur.fetchone()
        
        if not result:
            messages.error(request, "Budget request not found.")
            return redirect('budget_request_list')
        
        status, requester_id = result
        
        # Check ownership
        if requester_id != user_id:
            messages.error(request, "You can only delete your own budget requests.")
            return redirect('budget_request_list')
        
        # Only allow deletion of PENDING or REJECTED requests
        if status not in ('PENDING', 'REJECTED'):
            messages.error(request, "Only PENDING or REJECTED requests can be deleted.")
            return redirect('budget_request_list')
        
        try:
            # Delete will CASCADE to requested_event and breakdown lines
            cur.execute("DELETE FROM budget_request WHERE request_id = %s;", [request_id])
            messages.success(request, "Budget request deleted successfully.")
        except Exception as e:
            messages.error(request, f"Error deleting request: {e}")
    
    return redirect('budget_request_list')


# ---------- API DELETE Views ----------

@csrf_exempt
@require_http_methods(["DELETE"])
def api_delete_user(request, user_id):
    """DELETE: Deactivate user via API (ADMIN only)"""
    if not require_role(request, 'ADMIN'):
        return JsonResponse({'detail': 'Forbidden'}, status=403)
    
    current_user_id, _, _ = get_current_user(request)
    
    if current_user_id == user_id:
        return JsonResponse({'detail': 'Cannot deactivate your own account'}, status=400)
    
    with connection.cursor() as cur:
        cur.execute("""
            UPDATE users 
            SET is_active = FALSE 
            WHERE user_id = %s
            RETURNING user_id
        """, [user_id])
        row = cur.fetchone()
        
        if not row:
            return JsonResponse({'detail': 'User not found'}, status=404)
    
    return JsonResponse({'user_id': user_id, 'is_active': False})


@csrf_exempt
@require_http_methods(["DELETE"])
@transaction.atomic
def api_delete_budget_request(request, request_id):
    """DELETE: Delete budget request via API (owner or admin, PENDING or REJECTED only)"""
    user_id, role, _ = get_current_user(request)
    
    if not user_id:
        return JsonResponse({'detail': 'Unauthorized'}, status=401)
    
    with connection.cursor() as cur:
        # Check ownership and status
        cur.execute("""
            SELECT requester_id, status 
            FROM budget_request 
            WHERE request_id = %s
        """, [request_id])
        row = cur.fetchone()
        
        if not row:
            return JsonResponse({'detail': 'Request not found'}, status=404)
        
        requester_id, status = row
        
        # Check authorization: Admin can delete any request, Treasurer can only delete their own
        if role == 'ADMIN':
            # Admin can delete any request
            pass
        elif role == 'TREASURER':
            # Treasurer can only delete their own requests
            if requester_id != user_id:
                return JsonResponse({'detail': 'You can only delete your own budget requests'}, status=403)
        else:
            return JsonResponse({'detail': 'Unauthorized'}, status=403)
        
        # Check status - only PENDING or REJECTED can be deleted
        if status not in ('PENDING', 'REJECTED'):
            return JsonResponse({'detail': 'Only PENDING or REJECTED requests can be deleted'}, status=400)
        
        # Manually delete in correct order due to foreign key constraints
        # First, delete breakdown lines
        cur.execute("""
            DELETE FROM requested_break_down_line 
            WHERE req_event_id IN (
                SELECT req_event_id FROM requested_event WHERE request_id = %s
            )
        """, [request_id])
        
        # Then delete the event
        cur.execute("DELETE FROM requested_event WHERE request_id = %s", [request_id])
        
        # Delete any approval records (for REJECTED requests)
        cur.execute("DELETE FROM approval WHERE request_id = %s", [request_id])
        
        # Finally delete the budget request
        cur.execute("DELETE FROM budget_request WHERE request_id = %s", [request_id])
    
    return JsonResponse({'request_id': request_id, 'deleted': True})
