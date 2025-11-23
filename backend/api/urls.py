from django.urls import path
from .views import budget_api, auth_views, budget_views, admin_views, report_views, delete_views

urlpatterns = [
    # ----- Auth + home -----
    path('', auth_views.home, name='home'),
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('admin/create-account/', auth_views.create_account, name='create_account'),

    # ----- Dashboards -----
    path('admin/dashboard/', auth_views.admin_dashboard, name='admin_dashboard'),
    path('treasurer/dashboard/', auth_views.treasurer_dashboard, name='treasurer_dashboard'),

    # ----- HTML budget pages -----
    path('budget/new/', budget_views.new_budget, name='new_budget'),
    path('budget-requests/', budget_views.budget_request_list, name='budget_request_list'),
    path('budget-requests/<int:request_id>/edit/', budget_views.edit_budget, name='edit_budget'),
    path('budget-requests/<int:request_id>/delete/', delete_views.delete_budget_request, name='delete_budget_request'),

    # ----- Admin HTML pages -----
    path('admin/requests/', admin_views.pending_requests, name='pending_requests'),
    path('admin/requests/<int:request_id>/', admin_views.request_detail, name='request_detail'),
    path('admin/reports/monthly/', report_views.monthly_report, name='monthly_report'),
    path('admin/users/<int:user_id>/delete/', delete_views.delete_user, name='delete_user'),

    # ----- JSON API for React -----
    path('api/login/', auth_views.api_login, name='api_login'),
    path('api/current-user/', auth_views.api_current_user, name='api_current_user'),
    path('api/cities/', auth_views.api_cities, name='api_cities'),
    path('api/admin/users/', auth_views.api_create_user, name='api_create_user'),
    path('api/admin/dashboard/', budget_api.api_admin_dashboard, name='api_admin_dashboard'),
    path('api/admin/pending-requests/', budget_api.api_pending_requests, name='api_pending_requests'),
    path('api/admin/reports/monthly/', report_views.api_monthly_report, name='api_monthly_report'),
    path('api/treasurer/dashboard/', budget_api.api_treasurer_dashboard, name='api_treasurer_dashboard'),
    path('api/budget-requests/', budget_api.api_budget_requests, name='api_budget_list'),
    path('api/budget-requests/<int:request_id>/', budget_api.api_budget_request_detail, name='api_budget_detail'),
    path('api/budget-requests/<int:request_id>/approve/', budget_api.api_budget_approve, name='api_budget_approve'),
    path('api/budget-requests/<int:request_id>/reject/', budget_api.api_budget_reject, name='api_budget_reject'),
    path('api/budget-requests/<int:request_id>/delete/', delete_views.api_delete_budget_request, name='api_delete_budget_request'),
    path('api/users/<int:user_id>/delete/', delete_views.api_delete_user, name='api_delete_user'),
]
