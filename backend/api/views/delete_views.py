from django.shortcuts import redirect
from django.db import connection
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .auth_views import get_current_user, require_role


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
    """DELETE: Delete a budget request (TREASURER can delete their own PENDING requests)"""
    user_id, role, _ = get_current_user(request)
    
    if not user_id:
        return redirect('login')
    
    with connection.cursor() as cur:
        # Check if request belongs to user and is PENDING
        cur.execute("""
            SELECT requester_id, status 
            FROM budget_request 
            WHERE request_id = %s
        """, [request_id])
        row = cur.fetchone()
        
        if not row:
            messages.error(request, "Budget request not found.")
            return redirect('budget_request_list')
        
        requester_id, status = row
        
        # Only allow deletion if:
        # 1. User owns the request OR is ADMIN
        # 2. Status is PENDING
        if status != 'PENDING':
            messages.error(request, "Only PENDING requests can be deleted.")
            return redirect('budget_request_list')
        
        if requester_id != user_id and role != 'ADMIN':
            messages.error(request, "You can only delete your own requests.")
            return redirect('budget_request_list')
        
        # Delete request (CASCADE will delete events and line items)
        cur.execute("DELETE FROM budget_request WHERE request_id = %s", [request_id])
    
    messages.success(request, f"Budget request #{request_id} has been deleted.")
    return redirect('budget_request_list')


# ---------- API DELETE Views ----------

@csrf_exempt
@require_POST
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
@require_POST
def api_delete_budget_request(request, request_id):
    """DELETE: Delete budget request via API (owner or ADMIN, PENDING only)"""
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
        
        if status != 'PENDING':
            return JsonResponse({'detail': 'Only PENDING requests can be deleted'}, status=400)
        
        if requester_id != user_id and role != 'ADMIN':
            return JsonResponse({'detail': 'Forbidden'}, status=403)
        
        # Delete request
        cur.execute("DELETE FROM budget_request WHERE request_id = %s", [request_id])
    
    return JsonResponse({'request_id': request_id, 'deleted': True})
