from django.shortcuts import render
from django.db import connection

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
