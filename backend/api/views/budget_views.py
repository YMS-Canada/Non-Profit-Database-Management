from django.contrib import messages
from django.shortcuts import render, redirect
from django.db import connection
from .auth_views import get_current_user, require_login, require_role


def _fetch_requests_for_user(user_id, role, city_id):
    """
    READ: Return rows (request_id, month, description, status, created_at, requester_name)
    scoped by role.
    - ADMIN: sees all requests from all cities
    - TREASURER: sees only their own requests
    """
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
        return cur.fetchall()


def budget_request_list(request):
    """READ: List budget requests (role-based access)"""
    if not require_login(request):
        return redirect('login')

    user_id, role, city_id = get_current_user(request)
    rows = _fetch_requests_for_user(user_id, role, city_id)

    return render(
        request,
        'budget_list.html',
        {
            'rows': rows,
            'role': role,
        },
    )


def new_budget(request):
    """CREATE: Submit new budget request (Treasurer only)"""
    if not require_login(request):
        return redirect('login')

    user_id, role, city_id = get_current_user(request)
    
    # Only treasurers can submit budget requests
    if role != 'TREASURER':
        messages.error(request, "Only treasurers can submit budget requests.")
        return redirect('home')

    with connection.cursor() as cur:
        cur.execute("SELECT category_id, name FROM category ORDER BY name ASC;")
        categories = cur.fetchall()

    if request.method == 'POST':
        month = request.POST.get('month', '').strip()
        description = request.POST.get('description', '').strip()
        event_name = request.POST.get('event_name', '').strip()
        event_date = request.POST.get('event_date', '').strip()
        event_notes = request.POST.get('event_notes', '').strip()

        line_categories = request.POST.getlist('line_category')
        line_descriptions = request.POST.getlist('line_description')
        line_amounts = request.POST.getlist('line_amount')

        if not month or not event_name or not event_date:
            messages.error(request, "Month, event name, and event date are required.")
        else:
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
                    request_id = cur.fetchone()[0]

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
                            event_name,
                            event_date,
                            None,
                            event_notes or description,
                        ],
                    )
                    req_event_id = cur.fetchone()[0]

                    total_amount = 0
                    for cat, desc, amt in zip(
                        line_categories, line_descriptions, line_amounts
                    ):
                        desc = (desc or '').strip()
                        if not desc and not amt:
                            continue
                        try:
                            amount_value = float(amt)
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
                                int(cat) if cat else None,
                                desc,
                                amount_value,
                            ],
                        )

                    if total_amount:
                        cur.execute(
                            "UPDATE requested_event SET total_amount = %s WHERE req_event_id = %s",
                            [total_amount, req_event_id],
                        )

                messages.success(request, "Budget request submitted.")
                return redirect('budget_request_list')

            except Exception as exc:
                messages.error(request, f"Could not save request: {exc}")

    return render(
        request,
        'budget_new.html',
        {
            'role': role,
            'categories': categories,
            'line_range': range(3),
        },
    )


def edit_budget(request, request_id):
    """
    Edit existing budget request (only PENDING or REJECTED)
    TREASURER ONLY - can edit their own requests
    CRUD: UPDATE budget_request and related records
    """
    if not require_login(request):
        return redirect('login')
    
    user_id, role, city_id = get_current_user(request)
    
    # Only treasurers can edit
    if role != 'TREASURER':
        messages.error(request, "Only treasurers can edit budget requests.")
        return redirect('budget_request_list')
    
    # Get the budget request
    with connection.cursor() as cur:
        cur.execute("""
            SELECT br.request_id, br.city_id, br.month, br.description, br.status,
                   br.requester_id
            FROM budget_request br
            WHERE br.request_id = %s;
        """, [request_id])
        budget_req = cur.fetchone()
    
    if not budget_req:
        messages.error(request, "Budget request not found.")
        return redirect('budget_request_list')
    
    # Check if this is the requester's own request
    if budget_req[5] != user_id:
        messages.error(request, "You can only edit your own budget requests.")
        return redirect('budget_request_list')
    
    # Only allow editing PENDING or REJECTED requests
    if budget_req[4] not in ('PENDING', 'REJECTED'):
        messages.error(request, "Only PENDING or REJECTED requests can be edited.")
        return redirect('budget_request_list')
    
    if request.method == 'POST':
        month = request.POST.get('month', '').strip()
        description = request.POST.get('description', '').strip()
        event_name = request.POST.get('event_name', '').strip()
        event_date = request.POST.get('event_date', '').strip()
        event_notes = request.POST.get('event_notes', '').strip()
        
        line_categories = request.POST.getlist('line_category')
        line_descriptions = request.POST.getlist('line_description')
        line_amounts = request.POST.getlist('line_amount')
        
        if not (month and event_name and event_date):
            messages.error(request, "Month, event name, and event date are required.")
        else:
            with connection.cursor() as cur:
                try:
                    # Update budget_request - reset to PENDING if was REJECTED
                    cur.execute("""
                        UPDATE budget_request
                        SET month = %s, description = %s, status = 'PENDING'
                        WHERE request_id = %s;
                    """, [month, description, request_id])
                    
                    # Delete old requested_events and breakdown lines
                    cur.execute("DELETE FROM requested_break_down_line WHERE req_event_id IN (SELECT req_event_id FROM requested_event WHERE request_id = %s);", [request_id])
                    cur.execute("DELETE FROM requested_event WHERE request_id = %s;", [request_id])
                    
                    # Insert new requested_event
                    cur.execute("""
                        INSERT INTO requested_event (request_id, name, event_date, notes, total_amount)
                        VALUES (%s, %s, %s, %s, 0)
                        RETURNING req_event_id;
                    """, [request_id, event_name, event_date, event_notes])
                    req_event_id = cur.fetchone()[0]
                    
                    # Insert breakdown lines
                    total_amount = 0
                    for cat, desc, amt in zip(line_categories, line_descriptions, line_amounts):
                        desc_val = desc.strip() if desc else None
                        if not desc_val and not amt:
                            continue
                        
                        try:
                            amount = float(amt) if amt else 0.0
                        except (TypeError, ValueError):
                            amount = 0.0
                        
                        total_amount += amount
                        category_id = int(cat) if cat else None
                        
                        cur.execute("""
                            INSERT INTO requested_break_down_line (req_event_id, category_id, description, amount)
                            VALUES (%s, %s, %s, %s);
                        """, [req_event_id, category_id, desc_val, amount])
                    
                    # Update total amount
                    if total_amount:
                        cur.execute("UPDATE requested_event SET total_amount = %s WHERE req_event_id = %s", [total_amount, req_event_id])
                    
                    messages.success(request, "Budget request updated successfully and returned to PENDING status!")
                    return redirect('budget_request_list')
                    
                except Exception as e:
                    messages.error(request, f"Error updating request: {e}")
    
    # GET request - fetch existing data
    with connection.cursor() as cur:
        # Get categories
        cur.execute("SELECT category_id, name FROM category ORDER BY name;")
        categories = cur.fetchall()
        
        # Get existing event
        cur.execute("""
            SELECT req_event_id, name, event_date, notes
            FROM requested_event
            WHERE request_id = %s
            LIMIT 1;
        """, [request_id])
        event = cur.fetchone()
        
        # Get existing breakdown lines
        breakdown_lines = []
        if event:
            cur.execute("""
                SELECT category_id, description, amount
                FROM requested_break_down_line
                WHERE req_event_id = %s
                ORDER BY line_id;
            """, [event[0]])
            breakdown_lines = cur.fetchall()
    
    return render(request, 'budget_edit.html', {
        'budget_req': budget_req,
        'event': event,
        'breakdown_lines': breakdown_lines,
        'categories': categories,
        'line_range': range(3),
        'role': role,
    })
