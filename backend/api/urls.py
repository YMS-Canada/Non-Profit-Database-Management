from django.urls import path
from .views import budget_api, auth_views, budget_views, admin_views, report_views

urlpatterns = [
    # existing views...
    path('', auth_views.home, name='home'),
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),

    path('budget/new/', budget_views.new_budget, name='new_budget'),
    path('budget-requests/', budget_views.budget_request_list, name='budget_request_list'),

    path('api/budget-requests/', budget_api.api_budget_list, name='api_budget_list'),
    path('api/budget-requests/', budget_api.api_budget_create, name='api_budget_create'),
    path('api/budget-requests/<int:request_id>/approve', budget_api.api_budget_approve, name='api_budget_approve'),
    path('api/budget-requests/<int:request_id>/reject', budget_api.api_budget_reject, name='api_budget_reject'),
]
