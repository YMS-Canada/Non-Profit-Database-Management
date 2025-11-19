from django.urls import path
from .views import budget_api, auth_views, budget_views, admin_views, report_views

urlpatterns = [
    # existing views...
    path('', auth_views.home, name='home'),
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),

    path('budget/new/', budget_views.new_budget, name='new_budget'),
    path('budget-requests/', budget_views.budget_request_list, name='budget_request_list'),

    # 👇 NEW API ENDPOINT FOR REACT
    path('api/budget-requests/', budget_api.api_budget_list, name='api_budget_list'),
]
