from django.shortcuts import render
from django.db import connection
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group

@login_required
def dashboard(request):
    # Use Django's group system for admin check
    if request.user.groups.filter(name='Admin').exists():
        # Admin Dashboard
        with connection.cursor() as cur:
            cur.execute("""
                SELECT br.request_id, c.name AS city, br.month, br.description, br.status
                FROM budget_request br
                JOIN city c ON c.city_id = br.city_id
                WHERE br.status = 'PENDING'
                ORDER BY br.month DESC, br.request_id;
            """)
            pending_requests = cur.fetchall()

        with connection.cursor() as cur:
            cur.execute("""
                SELECT log_id, user_id, action, timestamp, details
                FROM audit_logs
                ORDER BY timestamp DESC LIMIT 50;
            """)
            audit_logs = cur.fetchall()

        context = {
            "pending_requests": [
                {"request_id": r[0], "city": r[1], "month": r[2], "description": r[3], "status": r[4]} for r in pending_requests
            ],
            "audit_logs": audit_logs,
        }
        return render(request, "api/admin_dashboard.html", context)

    else:
        # User Dashboard
        with connection.cursor() as cur:
            cur.execute("""
                SELECT br.request_id, br.month, br.description, br.status
                FROM budget_request br
                WHERE br.requester_id = %s
                ORDER BY br.month DESC, br.request_id;
            """, [request.user.id])
            user_requests = cur.fetchall()

        with connection.cursor() as cur:
            cur.execute("""
                SELECT br.request_id, br.status, br.updated_at
                FROM budget_request br
                WHERE br.requester_id = %s AND br.status IN ('APPROVED', 'REJECTED')
                ORDER BY br.updated_at DESC;
            """, [request.user.id])
            approvals = cur.fetchall()

        context = {
            "user_requests": [
                {"request_id": r[0], "month": r[1], "description": r[2], "status": r[3]} for r in user_requests
            ],
            "approvals": [
                {"request_id": r[0], "status": r[1], "updated_at": r[2]} for r in approvals
            ],
        }
        return render(request, "api/user_dashboard.html", context)

def budget_request_list(request):
    with connection.cursor() as cur:
        cur.execute("""
            SELECT 
                br.request_id,
                c.name AS city,
                br.month,
                br.description,
                br.status
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            ORDER BY br.month DESC, br.request_id;
        """)
        rows = cur.fetchall()

    requests = [
        {
            "request_id": r[0],
            "city": r[1],
            "month": r[2],
            "description": r[3],
            "status": r[4],
        }
        for r in rows
    ]

    return render(request, "api/budget_request_list.html", {"requests": requests})
