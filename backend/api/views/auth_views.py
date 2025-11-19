from django.shortcuts import render, redirect
from django.db import connection
from django.contrib import messages

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

        # ✅ redirect to a real route name
        return redirect('budget_request_list')
        # or: return redirect('home')

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
