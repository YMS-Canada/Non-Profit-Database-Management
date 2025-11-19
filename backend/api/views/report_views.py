from django.shortcuts import render, redirect
from django.db import connection
from .auth_views import require_role, get_current_user

def monthly_report(request):
    if not require_role(request, 'ADMIN'):
        return redirect('login')

    user_id, role, _ = get_current_user(request)

    rows = []
    with connection.cursor() as cur:
        cur.execute("""
            SELECT city, month, total_requested
            FROM vw_total_requested_per_city_month
            ORDER BY month DESC, city;
        """)
        rows = cur.fetchall()

    return render(request, 'admin/reports_monthly.html', {
        'rows': rows,
        'role': role,
    })
