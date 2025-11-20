from django.urls import path
from .views import budget_api, auth_views, budget_views, admin_views, report_views

urlpatterns = [
    # ----- Auth + home -----
    path('', auth_views.home, name='home'),
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('admin/create-account/', auth_views.create_account, name='create_account'),

    # ----- HTML budget pages -----
    path('budget/new/', budget_views.new_budget, name='new_budget'),
    path('budget-requests/', budget_views.budget_request_list, name='budget_request_list'),

    # ----- Admin HTML pages -----
    path('admin/requests/', admin_views.pending_requests, name='pending_requests'),
    path('admin/requests/<int:request_id>/', admin_views.request_detail, name='request_detail'),
    path('admin/reports/monthly/', report_views.monthly_report, name='monthly_report'),

    # ----- JSON API for React -----
    path('budget-requests/json/', budget_api.api_budget_requests, name='api_budget_requests'),
    path('budget-requests/<int:request_id>/approve/', budget_api.api_budget_approve, name='api_budget_approve'),
    path('budget-requests/<int:request_id>/reject/', budget_api.api_budget_reject, name='api_budget_reject'),
]
