from django.shortcuts import render, redirect
from django.db import connection
from .auth_views import require_role, get_current_user

def monthly_report(request):
    """
    ADMIN-only: Monthly report showing aggregated budget data.
    
    Queries the vw_total_requested_per_city_month view to display:
    - City name
    - Month
    - Total amount requested
    
    CRUD: READ (aggregated data, no write operations)
    """
    if not require_role(request, 'ADMIN'):
        return redirect('login')

    user_id, role, _ = get_current_user(request)

    rows = []
    with connection.cursor() as cur:
        cur.execute("""
            SELECT c.name AS city,
                   TO_CHAR(br.month, 'YYYY-MM') AS month,
                   COALESCE(SUM(re.total_amount), 0) AS total_requested
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            LEFT JOIN requested_event re ON re.request_id = br.request_id
            WHERE br.status = 'APPROVED'
            GROUP BY c.name, TO_CHAR(br.month, 'YYYY-MM')
            ORDER BY TO_CHAR(br.month, 'YYYY-MM') DESC, c.name;
        """)
        rows = cur.fetchall()

    return render(request, 'admin/reports_monthly.html', {
        'rows': rows,
        'role': role,
    })
