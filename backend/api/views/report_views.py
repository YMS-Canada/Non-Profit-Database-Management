from django.shortcuts import render, redirect
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .auth_views import require_role, get_current_user, require_login

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


@csrf_exempt
def api_monthly_report(request):
    """
    JSON API endpoint for monthly report data.
    Returns aggregated budget data by city and month.
    """
    user_id, role, city_id = get_current_user(request)
    
    # Check if user is logged in
    if not user_id:
        return JsonResponse({'detail': 'Authentication required'}, status=401)
    
    # Only admins can access reports
    if role != 'ADMIN':
        return JsonResponse({'detail': 'Admin access required'}, status=403)
    
    if request.method == 'GET':
        try:
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
                
                # Format data for JSON response
                data = [
                    {
                        'city': row[0],
                        'month': row[1],
                        'total_requested': float(row[2]) if row[2] else 0
                    }
                    for row in rows
                ]
                
                return JsonResponse({'data': data}, status=200)
                
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    
    return JsonResponse({'detail': 'Method not allowed'}, status=405)
