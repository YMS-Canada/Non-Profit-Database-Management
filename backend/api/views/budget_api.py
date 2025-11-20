import json

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .auth_views import get_current_user, require_login, require_role


def _list_requests_for_api(user_id, role, city_id):
    base_sql = """
        SELECT br.request_id,
               br.month,
               br.description,
               br.status,
               br.created_at,
               u.name AS requester_name
        FROM budget_request br
        LEFT JOIN users u ON u.user_id = br.requester_id
    """
    params = []
    if role == 'ADMIN':
        sql = base_sql + " WHERE br.city_id = %s ORDER BY br.created_at DESC"
        params = [city_id]
    else:
        sql = (
            base_sql
            + " WHERE br.requester_id = %s AND br.city_id = %s ORDER BY br.created_at DESC"
        )
        params = [user_id, city_id]

    with connection.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()

    return [
        {
            "request_id": r[0],
            "month": r[1],
            "description": r[2],
            "status": r[3],
            "created_at": r[4],
            "requester": r[5],
        }
        for r in rows
    ]


@csrf_exempt
def api_budget_requests(request):
    if not require_login(request):
        return JsonResponse({'detail': 'Unauthorized'}, status=401)

    user_id, role, city_id = get_current_user(request)

    if request.method == 'GET':
        data = _list_requests_for_api(user_id, role, city_id)
        return JsonResponse(data, safe=False)

    if request.method == 'POST':
        try:
            payload = json.loads(request.body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return JsonResponse({'detail': 'Invalid JSON'}, status=400)

        month = payload.get('month')
        description = (payload.get('description') or '').strip()
        event = payload.get('event') or {}
        breakdown = payload.get('breakdown') or []

        required_fields = [month, event.get('name'), event.get('event_date')]
        if not all(required_fields):
            return JsonResponse({'detail': 'month, event.name, and event.event_date are required'}, status=400)

        try:
            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO budget_request
                        (city_id, requester_id, recipient_id, month, description, status, created_at)
                    VALUES
                        (%s, %s, NULL, %s, %s, 'PENDING', NOW())
                    RETURNING request_id
                """,
                    [city_id, user_id, month, description],
                )
                row = cur.fetchone()
                if not row:
                    raise Exception("Failed to retrieve request_id after INSERT")
                request_id = row[0]

                cur.execute(
                    """
                    INSERT INTO requested_event
                        (request_id, name, event_date, total_amount, notes)
                    VALUES
                        (%s, %s, %s, %s, %s)
                    RETURNING req_event_id
                """,
                    [
                        request_id,
                        event['name'],
                        event['event_date'],
                        None,
                        event.get('notes') or description,
                    ],
                )
                row = cur.fetchone()
                if not row:
                    raise Exception("Failed to retrieve req_event_id after INSERT")
                req_event_id = row[0]

                total_amount = 0
                for line in breakdown:
                    desc = (line.get('description') or '').strip()
                    amount = line.get('amount')
                    if desc == '' and not amount:
                        continue
                    category_id = line.get('category_id')
                    if category_id in ('', None):
                        category_id = None
                    else:
                        try:
                            category_id = int(category_id)
                        except (TypeError, ValueError):
                            category_id = None
                    try:
                        amount_value = float(amount)
                    except (TypeError, ValueError):
                        amount_value = 0
                    total_amount += amount_value

                    cur.execute(
                        """
                        INSERT INTO requested_break_down_line
                            (req_event_id, category_id, description, amount)
                        VALUES
                            (%s, %s, %s, %s)
                    """,
                        [
                            req_event_id,
                            category_id,
                            desc,
                            amount_value,
                        ],
                    )

                if total_amount:
                    cur.execute(
                        "UPDATE requested_event SET total_amount = %s WHERE req_event_id = %s",
                        [total_amount, req_event_id],
                    )

            return JsonResponse(
                {
                    'request_id': request_id,
                    'req_event_id': req_event_id,
                    'status': 'PENDING',
                },
                status=201,
            )
        except Exception as exc:
            return JsonResponse({'detail': str(exc)}, status=500)

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


# Expose aliases so urls can give separate names for GET/POST
api_budget_list = api_budget_requests
api_budget_create = api_budget_requests


def _update_request_status(request_id, city_id, new_status, decision, approver_id):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT city_id FROM budget_request WHERE request_id = %s",
            [request_id],
        )
        row = cur.fetchone()
        if not row:
            return JsonResponse({'detail': 'Request not found'}, status=404)
        if row[0] != city_id:
            return JsonResponse({'detail': 'Forbidden'}, status=403)

        cur.execute(
            "UPDATE budget_request SET status = %s WHERE request_id = %s",
            [new_status, request_id],
        )
        cur.execute(
            """
            INSERT INTO approval (request_id, approver_id, decision, note, decided_at)
            VALUES (%s, %s, %s, NULL, NOW())
        """,
            [request_id, approver_id, decision],
        )
    return JsonResponse({'request_id': request_id, 'status': new_status})


@csrf_exempt
@require_POST
def api_budget_approve(request, request_id):
    if not require_role(request, 'ADMIN'):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    user_id, _, city_id = get_current_user(request)
    response = _update_request_status(
        request_id, city_id, 'APPROVED', 'YES', user_id
    )
    return response


@csrf_exempt
@require_POST
def api_budget_reject(request, request_id):
    if not require_role(request, 'ADMIN'):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    user_id, _, city_id = get_current_user(request)
    response = _update_request_status(
        request_id, city_id, 'REJECTED', 'NO-PLEASE RESEND', user_id
    )
    return response
