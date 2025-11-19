from django.urls import path, include

from . import views
from .views import auth_views, budget_views, admin_views, report_views

urlpatterns = [
    # Home + Auth
    path('', auth_views.home, name='home'),
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),

    # Treasurer pages
    path('budget/new/', budget_views.new_budget, name='new_budget'),
    path('budget-requests/', budget_views.budget_request_list, name='budget_request_list'),

    # Admin pages
    path('admin/requests/', admin_views.pending_requests, name='pending_requests'),
    path('admin/request/<int:request_id>/', admin_views.request_detail, name='request_detail'),

    # Reports
    path('reports/monthly/', report_views.monthly_report, name='monthly_report'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('api/', include('api.urls')),
]
