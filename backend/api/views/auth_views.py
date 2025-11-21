from django.shortcuts import render, redirect
from django.db import connection
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# ---------- Helpers ----------

def get_current_user(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role')
    city_id = request.session.get('city_id')
    return user_id, role, city_id

def require_login(request):
    user_id, role, city_id = get_current_user(request)
    if not user_id:
        return False
    return True

def require_role(request, needed_role):
    user_id, role, city_id = get_current_user(request)
    return user_id is not None and role == needed_role

# ---------- Views ----------

def home(request):
    user_id, role, city_id = get_current_user(request)
    return render(request, 'home.html', {
        'user_id': user_id,
        'role': role,
    })


def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '').strip()

        with connection.cursor() as cur:
            cur.execute("""
                SELECT user_id, role, city_id
                FROM users
                WHERE email = %s
                  AND password_hash = %s
                  AND is_active = TRUE
            """, [email, password])
            row = cur.fetchone()

        if not row:
            messages.error(request, "Invalid email or password.")
            return render(request, 'login.html')

        request.session['user_id'] = row[0]
        request.session['role'] = row[1]
        request.session['city_id'] = row[2]

        # Role-based redirect
        if row[1] == 'ADMIN':
            return redirect('admin_dashboard')
        elif row[1] == 'TREASURER':
            return redirect('treasurer_dashboard')
        else:
            return redirect('home')

    return render(request, 'login.html')


def logout_view(request):
    request.session.flush()
    return redirect('login')


def create_account(request):
    # Only logged-in admins can create accounts
    if not require_role(request, 'ADMIN'):
        return redirect('login')

    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        email = request.POST.get('email', '').strip()
        whatsapp = request.POST.get('whatsapp', '').strip()
        role = request.POST.get('role', '').strip()
        city_id = request.POST.get('city_id', '').strip()
        password = request.POST.get('password', '').strip()

        if role not in ('ADMIN', 'TREASURER'):
            messages.error(request, "Role must be ADMIN or TREASURER.")
            return render(request, 'admin/create_account.html')

        if not (name and email and password and city_id):
            messages.error(request, "Name, email, password, and city are required.")
            return render(request, 'admin/create_account.html')

        with connection.cursor() as cur:
            try:
                cur.execute("""
                    INSERT INTO users (name, email, whatsapp, role, password_hash, city_id, invited_at, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), TRUE)
                """, [name, email, whatsapp, role, password, city_id])
                messages.success(request, "User account created successfully.")
                return redirect('home')
            except Exception as e:
                messages.error(request, f"Error creating user: {e}")

    # Need list of cities for dropdown
    cities = []
    with connection.cursor() as cur:
        cur.execute("SELECT city_id, name, province FROM city ORDER BY name;")
        cities = cur.fetchall()

    return render(request, 'admin/create_account.html', {
        'cities': cities,
    })


# ---------- Dashboard Views ----------

def admin_dashboard(request):
    """Admin dashboard with overview of all requests and admin CRUD operations"""
    if not require_role(request, 'ADMIN'):
        return redirect('login')
    
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
        pending_requests = cur.fetchall()
        
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
        recent_activity = cur.fetchall()
        
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
        monthly_report = cur.fetchall()
    
    return render(request, 'admin/admin_dashboard.html', {
        'role': role,
        'stats': stats,
        'pending_requests': pending_requests,
        'recent_activity': recent_activity,
        'monthly_report': monthly_report,
    })


def treasurer_dashboard(request):
    """Treasurer dashboard with their city's budget requests"""
    if not require_role(request, 'TREASURER'):
        return redirect('login')
    
    user_id, role, city_id = get_current_user(request)
    
    stats = {}
    my_requests = []
    
    with connection.cursor() as cur:
        # Get statistics for this treasurer's city
        cur.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
                COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
                COUNT(*) as total_count
            FROM budget_request
            WHERE city_id = %s AND requester_id = %s;
        """, [city_id, user_id])
        row = cur.fetchone()
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
        my_requests = cur.fetchall()
    
    return render(request, 'treasurer/treasurer_dashboard.html', {
        'role': role,
        'stats': stats,
        'my_requests': my_requests,
    })


# ---------- API Endpoints ----------

@csrf_exempt
def api_login(request):
    """JSON API endpoint for login from React"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    if not email or not password:
        return JsonResponse({'error': 'Email and password are required'}, status=400)
    
    with connection.cursor() as cur:
        cur.execute("""
            SELECT u.user_id, u.name, u.email, u.role, u.city_id, c.name as city_name
            FROM users u
            LEFT JOIN city c ON c.city_id = u.city_id
            WHERE u.email = %s
              AND u.password_hash = %s
              AND u.is_active = TRUE
        """, [email, password])
        row = cur.fetchone()
    
    if not row:
        return JsonResponse({'error': 'Invalid email or password'}, status=401)
    
    # Set session
    request.session['user_id'] = row[0]
    request.session['role'] = row[3]
    request.session['city_id'] = row[4]
    
    return JsonResponse({
        'user': {
            'user_id': row[0],
            'name': row[1],
            'email': row[2],
            'role': row[3],
            'city_id': row[4],
            'city_name': row[5],
        }
    })

def api_current_user(request):
    """API endpoint to get current logged-in user info"""
    user_id, role, city_id = get_current_user(request)
    
    if not user_id:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    with connection.cursor() as cur:
        cur.execute("""
            SELECT u.user_id, u.name, u.email, u.role, u.city_id, c.name as city_name
            FROM users u
            LEFT JOIN city c ON c.city_id = u.city_id
            WHERE u.user_id = %s AND u.is_active = TRUE
        """, [user_id])
        row = cur.fetchone()
    
    if not row:
        return JsonResponse({'error': 'User not found'}, status=404)
    
    return JsonResponse({
        'user': {
            'user_id': row[0],
            'name': row[1],
            'email': row[2],
            'role': row[3],
            'city_id': row[4],
            'city_name': row[5],
        }
    })
