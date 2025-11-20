from django.shortcuts import render, redirect
from django.db import connection
from django.contrib import messages
from .auth_views import get_current_user, require_role

def pending_requests(request):
    """READ: List all pending budget requests (Admin only)"""
    if not require_role(request, 'ADMIN'):
        return redirect('login')

    user_id, role, city_id = get_current_user(request)

    with connection.cursor() as cur:
        cur.execute("""
            SELECT br.request_id,
                   c.name AS city_name,
                   br.month,
                   br.description,
                   br.status,
                   u.name AS requester_name
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            LEFT JOIN users u ON u.user_id = br.requester_id
            WHERE br.status = 'PENDING'
            ORDER BY br.created_at;
        """)
        rows = cur.fetchall()

    return render(request, 'admin/request_list.html', {
        'rows': rows,
        'role': role,
    })


def request_detail(request, request_id):
    """READ + UPDATE: View and approve/reject budget requests (Admin only)"""
    if not require_role(request, 'ADMIN'):
        return redirect('login')

    user_id, role, _ = get_current_user(request)

    if request.method == 'POST':
        # UPDATE operation
        decision = request.POST.get('decision')
        note = request.POST.get('note', '').strip()

        with connection.cursor() as cur:
            if decision == 'APPROVE':
                # Call your PL/pgSQL function
                cur.execute("SELECT approve_request(%s, %s, %s);",
                            [request_id, user_id, note])
                messages.success(request, f"Request #{request_id} has been approved.")
            elif decision == 'REJECT':
                cur.execute("""
                    UPDATE budget_request
                    SET status = 'REJECTED'
                    WHERE request_id = %s
                """, [request_id])
                messages.warning(request, f"Request #{request_id} has been rejected.")

        return redirect('pending_requests')

    # READ operation
    req = None
    events = []

    with connection.cursor() as cur:
        # Request header
        cur.execute("""
            SELECT br.request_id,
                   c.name AS city_name,
                   br.month,
                   br.description,
                   br.status,
                   u.name AS requester_name
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            LEFT JOIN users u ON u.user_id = br.requester_id
            WHERE br.request_id = %s;
        """, [request_id])
        req = cur.fetchone()

        # Requested events & breakdown, if any
        cur.execute("""
            SELECT re.req_event_id,
                   re.name,
                   re.event_date,
                   re.total_amount
            FROM requested_event re
            WHERE re.request_id = %s;
        """, [request_id])
        events = cur.fetchall()

    return render(request, 'admin/request_detail.html', {
        'req': req,
        'events': events,
        'role': role,
    })
