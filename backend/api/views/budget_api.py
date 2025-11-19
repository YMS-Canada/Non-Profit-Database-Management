from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db import connection
from .auth_views import get_current_user, require_login

@require_GET
def api_budget_list(request):
    if not require_login(request):
        return JsonResponse({'detail': 'Unauthorized'}, status=401)

    user_id, role, city_id = get_current_user(request)

    with connection.cursor() as cur:
        cur.execute("""
            SELECT request_id, month, description, status, created_at
            FROM budget_request
            WHERE requester_id = %s
            ORDER BY created_at DESC
        """, [user_id])
        rows = cur.fetchall()

    data = [
        {
            "request_id": r[0],
            "month": r[1],
            "description": r[2],
            "status": r[3],
            "created_at": r[4],
        }
        for r in rows
    ]
    return JsonResponse(data, safe=False)
