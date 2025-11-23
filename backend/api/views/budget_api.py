import json

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .auth_views import get_current_user, require_login, require_role


def _list_requests_for_api(user_id, role, city_id):
    """
    Returns list of budget requests as dicts.
    - ADMIN: sees all requests from all cities
    - TREASURER: sees only their own requests
    """
    base_sql = """
        SELECT br.request_id,
               br.month,
               br.description,
               br.status,
               br.created_at,
               u.name AS requester_name,
               br.requester_id,
               COALESCE(re.total_amount, 0) AS total_amount
        FROM budget_request br
        LEFT JOIN users u ON u.user_id = br.requester_id
        LEFT JOIN requested_event re ON re.request_id = br.request_id
    """
    params = []
    if role == 'ADMIN':
        # Admin sees all requests (no filtering)
        sql = base_sql + " ORDER BY br.created_at DESC"
        params = []
    else:
        # Treasurer sees only their own requests
        sql = (
            base_sql
            + " WHERE br.requester_id = %s ORDER BY br.created_at DESC"
        )
        params = [user_id]

    with connection.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()

    return [
        {
            "request_id": r[0],
            "month": r[1].isoformat() if r[1] else None,
            "description": r[2],
            "status": r[3],
            "created_at": r[4].isoformat() if r[4] else None,
            "requester": r[5],
            "requester_id": r[6],
            "total_amount": float(r[7]) if r[7] else 0,
        }
        for r in rows
    ]


@csrf_exempt
def api_budget_requests(request):
    """
    JSON API endpoint for budget requests.
    
    GET: Returns list of budget requests (role-based filtering)
         - ADMIN: sees all requests
         - TREASURER: sees only their own requests
    
    POST: Creates new budget request with event and breakdown lines
          Required fields: month, event.name, event.event_date
          Returns: { request_id, req_event_id, status: "PENDING" }
    """
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


@csrf_exempt
def api_budget_request_detail(request, request_id):
    """
    GET: Return detailed information about a specific budget request
    PUT: Update and resubmit a budget request (sets status to PENDING)
    """
    user_id, role, city_id = get_current_user(request)
    
    # Check if user is logged in
    if not user_id:
        return JsonResponse({'detail': 'Authentication required'}, status=401)
    
    if request.method == 'GET':
        # Fetch request details with event and breakdown lines
        try:
            with connection.cursor() as cur:
                # Get request and event details
                cur.execute("""
                    SELECT 
                        br.request_id,
                        br.requester_id,
                        br.month,
                        br.description,
                        br.status,
                        br.created_at,
                        re.name,
                        re.event_date,
                        re.notes,
                        re.total_amount
                    FROM budget_request br
                    LEFT JOIN requested_event re ON br.request_id = re.request_id
                    WHERE br.request_id = %s
                """, [request_id])
                
                row = cur.fetchone()
                if not row:
                    return JsonResponse({'detail': 'Request not found'}, status=404)
                
                # Build request object
                request_data = {
                    'request_id': row[0],
                    'requester_id': row[1],
                    'month': row[2].isoformat() if row[2] else None,
                    'description': row[3],
                    'status': row[4],
                    'created_at': row[5].isoformat() if row[5] else None,
                    'event': {
                        'name': row[6],
                        'event_date': row[7].isoformat() if row[7] else None,
                        'notes': row[8],
                        'total_amount': float(row[9]) if row[9] else 0,
                    }
                }
                
                # Get breakdown lines (linked through event)
                cur.execute("""
                    SELECT rbl.line_id, rbl.description, rbl.amount, rbl.category_id
                    FROM requested_break_down_line rbl
                    JOIN requested_event re ON rbl.req_event_id = re.req_event_id
                    WHERE re.request_id = %s
                    ORDER BY rbl.line_id
                """, [request_id])
                
                breakdown_lines = []
                for line_row in cur.fetchall():
                    breakdown_lines.append({
                        'line_id': line_row[0],
                        'description': line_row[1],
                        'amount': float(line_row[2]) if line_row[2] else 0,
                        'category_id': line_row[3],
                    })
                
                request_data['breakdown_lines'] = breakdown_lines
                
                # Get approval/rejection comment if exists
                cur.execute("""
                    SELECT note, decided_at, decision
                    FROM approval
                    WHERE request_id = %s
                    ORDER BY decided_at DESC
                    LIMIT 1
                """, [request_id])
                
                approval_row = cur.fetchone()
                if approval_row:
                    request_data['admin_comment'] = approval_row[0]
                    request_data['decided_at'] = approval_row[1].isoformat() if approval_row[1] else None
                    request_data['decision'] = approval_row[2]
                
                return JsonResponse(request_data, status=200)
                
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    
    elif request.method == 'PUT':
        # Update budget request and reset to PENDING
        
        # Only treasurers can update their own requests
        if role != 'TREASURER':
            return JsonResponse({'detail': 'Only treasurers can update requests'}, status=403)
        
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'detail': 'Invalid JSON'}, status=400)
        
        # Validate ownership
        try:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT requester_id FROM budget_request WHERE request_id = %s",
                    [request_id]
                )
                row = cur.fetchone()
                if not row:
                    return JsonResponse({'detail': 'Request not found'}, status=404)
                
                if row[0] != user_id:
                    return JsonResponse({'detail': 'You can only edit your own requests'}, status=403)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
        
        # Extract fields
        month = data.get('month')
        description = data.get('description', '')
        
        # Extract event data (nested structure from frontend)
        event_data = data.get('event', {})
        event_name = event_data.get('name')
        event_date = event_data.get('event_date')
        event_notes = event_data.get('notes', '')  # Frontend sends 'notes' not 'event_notes'
        
        # Extract breakdown lines
        breakdown_lines = data.get('breakdown', [])
        
        if not month:
            return JsonResponse({'detail': 'Month is required'}, status=400)
        if not event_name:
            return JsonResponse({'detail': 'Event name is required'}, status=400)
        if not breakdown_lines:
            return JsonResponse({'detail': 'At least one breakdown line is required'}, status=400)
        
        # Calculate total
        try:
            amount_requested = sum(float(line.get('amount', 0)) for line in breakdown_lines)
        except (ValueError, TypeError):
            return JsonResponse({'detail': 'Invalid breakdown amounts'}, status=400)
        
        # Update database
        try:
            with connection.cursor() as cur:
                # Update budget_request (reset status to PENDING)
                cur.execute("""
                    UPDATE budget_request 
                    SET month = %s, description = %s, status = 'PENDING'
                    WHERE request_id = %s
                """, [month, description, request_id])
                
                # Delete old breakdown lines first (before deleting event due to foreign key)
                cur.execute("""
                    DELETE FROM requested_break_down_line 
                    WHERE req_event_id IN (
                        SELECT req_event_id FROM requested_event WHERE request_id = %s
                    )
                """, [request_id])
                
                # Delete old event
                cur.execute(
                    "DELETE FROM requested_event WHERE request_id = %s",
                    [request_id]
                )
                
                # Insert new event and get its ID
                req_event_id = None
                if event_name:
                    # Calculate total amount
                    total_amount = sum(float(line.get('amount', 0)) for line in breakdown_lines)
                    
                    cur.execute("""
                        INSERT INTO requested_event (request_id, name, event_date, notes, total_amount)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING req_event_id
                    """, [request_id, event_name, event_date, event_notes, total_amount])
                    req_event_id = cur.fetchone()[0]
                
                    # Insert new breakdown lines linked to the event
                    for line in breakdown_lines:
                        line_desc = line.get('description', '')
                        line_amt = float(line.get('amount', 0))
                        category_id = line.get('category_id')
                        cur.execute("""
                            INSERT INTO requested_break_down_line (req_event_id, description, amount, category_id)
                            VALUES (%s, %s, %s, %s)
                        """, [req_event_id, line_desc, line_amt, category_id])
            
            return JsonResponse({
                'request_id': request_id,
                'status': 'PENDING',
                'message': 'Budget request updated successfully'
            }, status=200)
            
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


def _update_request_status(request_id, new_status, decision, approver_id, comment=None):
    """
    Updates budget_request status and inserts approval record.
    Returns JsonResponse with request_id and new status.
    """
    try:
        with connection.cursor() as cur:
            # Check if request exists
            cur.execute(
                "SELECT request_id FROM budget_request WHERE request_id = %s",
                [request_id],
            )
            row = cur.fetchone()
            if not row:
                return JsonResponse({'detail': 'Request not found'}, status=404)

            # Update status
            cur.execute(
                "UPDATE budget_request SET status = %s WHERE request_id = %s",
                [new_status, request_id],
            )
            
            # Insert approval record with optional comment
            cur.execute(
                """
                INSERT INTO approval (request_id, approver_id, decision, note, decided_at)
                VALUES (%s, %s, %s, %s, NOW())
            """,
                [request_id, approver_id, decision, comment],
            )
        return JsonResponse({'request_id': request_id, 'status': new_status})
    except Exception as exc:
        # Log full traceback to the server console for debugging
        import traceback
        traceback.print_exc()
        return JsonResponse({'detail': f'Internal error: {str(exc)}'}, status=500)


@csrf_exempt
@require_POST
def api_budget_approve(request, request_id):
    """
    ADMIN-only: Approve a budget request via API.
    Accepts optional comment in request body.
    Returns JSON { request_id, status: "APPROVED" }
    """
    if not require_role(request, 'ADMIN'):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    user_id, _, _ = get_current_user(request)
    
    # Get optional comment from request body
    comment = None
    try:
        data = json.loads(request.body)
        comment = data.get('comment', '').strip() or None
    except (json.JSONDecodeError, AttributeError):
        pass
    
    response = _update_request_status(
        request_id, 'APPROVED', 'YES', user_id, comment
    )
    return response


@csrf_exempt
@require_POST
def api_budget_reject(request, request_id):
    """
    ADMIN-only: Reject a budget request via API.
    Accepts optional comment in request body.
    Returns JSON { request_id, status: "REJECTED" }
    """
    if not require_role(request, 'ADMIN'):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    user_id, _, _ = get_current_user(request)
    
    # Get optional comment from request body
    comment = None
    try:
        data = json.loads(request.body)
        comment = data.get('comment', '').strip() or None
    except (json.JSONDecodeError, AttributeError):
        pass
    
    response = _update_request_status(
        request_id, 'REJECTED', 'NO-PLEASE RESEND', user_id, comment
    )
    return response


# ---------- Dashboard API Endpoints ----------

@csrf_exempt
def api_admin_dashboard(request):
    """JSON API endpoint for admin dashboard data"""
    if not require_role(request, 'ADMIN'):
        return JsonResponse({'detail': 'Forbidden'}, status=403)
    
    user_id, role, city_id = get_current_user(request)
    
    stats = {}
    pending_requests = []
    recent_activity = []
    monthly_report = []
    
    with connection.cursor() as cur:
        # Get statistics
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
                COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
                COUNT(*) as total_count
            FROM budget_request;
        """)
        row = cur.fetchone()
        if not row:
            row = (0, 0, 0, 0)
        stats = {
            'pending': row[0] or 0,
            'approved': row[1] or 0,
            'rejected': row[2] or 0,
            'total': row[3] or 0,
        }
        
        # Get pending requests
        cur.execute("""
            SELECT br.request_id,
                   c.name AS city_name,
                   br.month,
                   br.description,
                   br.status,
                   u.name AS requester_name,
                   br.created_at
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            LEFT JOIN users u ON u.user_id = br.requester_id
            WHERE br.status = 'PENDING'
            ORDER BY br.created_at DESC
            LIMIT 10;
        """)
        pending_requests = [
            {
                'request_id': r[0],
                'city_name': r[1],
                'month': r[2].isoformat() if r[2] else None,
                'description': r[3],
                'status': r[4],
                'requester_name': r[5],
                'created_at': r[6].isoformat() if r[6] else None,
            }
            for r in cur.fetchall()
        ]
        
        # Get recent activity (all statuses)
        cur.execute("""
            SELECT br.request_id,
                   c.name AS city_name,
                   br.month,
                   br.status,
                   u.name AS requester_name,
                   br.created_at
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            LEFT JOIN users u ON u.user_id = br.requester_id
            ORDER BY br.created_at DESC
            LIMIT 10;
        """)
        recent_activity = [
            {
                'request_id': r[0],
                'city_name': r[1],
                'month': r[2].isoformat() if r[2] else None,
                'status': r[3],
                'requester_name': r[4],
                'created_at': r[5].isoformat() if r[5] else None,
            }
            for r in cur.fetchall()
        ]
        
        # Get monthly report - combining ALL APPROVED requests per city/month
        cur.execute("""
            SELECT c.name AS city,
                   TO_CHAR(br.month, 'YYYY-MM') AS month,
                   COALESCE(SUM(re.total_amount), 0) AS total_amount
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            LEFT JOIN requested_event re ON re.request_id = br.request_id
            WHERE br.status = 'APPROVED'
            GROUP BY c.name, TO_CHAR(br.month, 'YYYY-MM')
            ORDER BY TO_CHAR(br.month, 'YYYY-MM') DESC, c.name;
        """)
        monthly_report = [
            {
                'city': r[0],
                'month': r[1],
                'total_amount': float(r[2]) if r[2] else 0,
            }
            for r in cur.fetchall()
        ]
    
    return JsonResponse({
        'stats': stats,
        'pending_requests': pending_requests,
        'recent_activity': recent_activity,
        'monthly_report': monthly_report,
    })


@csrf_exempt
def api_pending_requests(request):
    """JSON API endpoint for pending/rejected requests (Admin only)"""
    if not require_role(request, 'ADMIN'):
        return JsonResponse({'detail': 'Forbidden'}, status=403)

    try:
        user_id, role, city_id = get_current_user(request)

        with connection.cursor() as cur:
            # Get all PENDING and REJECTED requests from all cities
            cur.execute("""
                     SELECT br.request_id,
                         c.name AS city_name,
                         br.month,
                         br.description,
                         br.status,
                         u.name AS requester_name,
                         u.email AS requester_email,
                         br.created_at,
                         re.total_amount
                FROM budget_request br
                JOIN city c ON c.city_id = br.city_id
                LEFT JOIN users u ON u.user_id = br.requester_id
                LEFT JOIN requested_event re ON br.request_id = re.request_id
                WHERE br.status IN ('PENDING', 'REJECTED')
                ORDER BY 
                    CASE WHEN br.status = 'PENDING' THEN 0 ELSE 1 END,
                    br.created_at DESC;
            """)
            rows = cur.fetchall()

        requests = []
        for r in rows:
            # defensive handling in case any column is None or unexpected
            try:
                month_val = r[2].isoformat() if r[2] is not None else None
            except Exception:
                month_val = str(r[2]) if r[2] is not None else None

            try:
                created_at = r[7].isoformat() if r[7] is not None else None
            except Exception:
                created_at = str(r[7]) if r[7] is not None else None

            # Database does not have an explicit updated_at column; use created_at as fallback
            updated_at = created_at

            requests.append({
                'request_id': r[0],
                'city_name': r[1],
                'month': month_val,
                'description': r[3],
                'status': r[4],
                'requester_name': r[5],
                'requester_email': r[6],
                'created_at': created_at,
                'updated_at': updated_at,
                'amount': float(r[8]) if r[8] is not None else 0,
            })

        return JsonResponse({'requests': requests})
    except Exception as exc:
        # Log traceback to console for debugging and return error message
        import traceback
        traceback.print_exc()
        return JsonResponse({'detail': str(exc)}, status=500)


@csrf_exempt
def api_treasurer_dashboard(request):
    """JSON API endpoint for treasurer dashboard data"""
    if not require_login(request):
        return JsonResponse({'detail': 'Unauthorized'}, status=401)
    
    user_id, role, city_id = get_current_user(request)
    
    if role != 'TREASURER':
        return JsonResponse({'detail': 'Forbidden'}, status=403)
    
    stats = {}
    my_requests = []
    
    with connection.cursor() as cur:
        # Get statistics for this treasurer's requests
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
                COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
                COUNT(*) as total_count
            FROM budget_request
            WHERE requester_id = %s;
        """, [user_id])
        row = cur.fetchone()
        if not row:
            row = (0, 0, 0, 0)
        stats = {
            'pending': row[0] or 0,
            'approved': row[1] or 0,
            'rejected': row[2] or 0,
            'total': row[3] or 0,
        }
        
        # Get this treasurer's requests
        cur.execute("""
            SELECT br.request_id,
                   c.name AS city_name,
                   br.month,
                   br.description,
                   br.status,
                   br.created_at
            FROM budget_request br
            JOIN city c ON c.city_id = br.city_id
            WHERE br.requester_id = %s
            ORDER BY br.created_at DESC;
        """, [user_id])
        my_requests = [
            {
                'request_id': r[0],
                'city_name': r[1],
                'month': r[2].isoformat() if r[2] else None,
                'description': r[3],
                'status': r[4],
                'created_at': r[5].isoformat() if r[5] else None,
            }
            for r in cur.fetchall()
        ]
    
    return JsonResponse({
        'stats': stats,
        'my_requests': my_requests,
    })
