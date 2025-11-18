from django.urls import path
from . import views

urlpatterns = [
    path('budget-requests/', views.budget_request_list, name='budget_request_list'),
]
