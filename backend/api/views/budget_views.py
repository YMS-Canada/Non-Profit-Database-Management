from django.contrib import messages
from django.shortcuts import render, redirect
from django.db import connection
from .auth_views import get_current_user, require_login


def _fetch_requests_for_user(user_id, role, city_id):
    """
    Return rows (request_id, month, description, status, created_at, requester_name)
    scoped by role.
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
        return cur.fetchall()


def budget_request_list(request):
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
    if not require_login(request):
        return redirect('login')

    user_id, role, city_id = get_current_user(request)

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
