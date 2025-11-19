from django.shortcuts import render, redirect
from django.db import connection
from .auth_views import get_current_user, require_login

def budget_request_list(request):
    if not require_login(request):
        return redirect('login')

    user_id, role, city_id = get_current_user(request)

    with connection.cursor() as cur:
        cur.execute("""
            SELECT request_id, month, description, status, created_at
            FROM budget_request
            WHERE requester_id = %s
            ORDER BY created_at DESC
        """, [user_id])
        rows = cur.fetchall()

    return render(request, 'budget_list.html', {
        'rows': rows,
        'role': role,
    })


def new_budget(request):
    if not require_login(request):
        return redirect('login')

    user_id, role, city_id = get_current_user(request)

    if role != 'TREASURER':
        return redirect('home')

    if request.method == 'POST':
        month = request.POST.get('month')
        description = request.POST.get('description', '').strip()

        with connection.cursor() as cur:
            cur.execute("""
                INSERT INTO budget_request
                    (city_id, requester_id, recipient_id, month, description, status, created_at)
                VALUES
                    (%s, %s, NULL, %s, %s, 'PENDING', NOW())
            """, [city_id, user_id, month, description])

        return redirect('budget_request_list')

    return render(request, 'budget_new.html', {
        'role': role,
    })
