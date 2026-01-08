"""
URL Configuration for User Authentication
"""

from django.urls import path
from .auth_views import (
    LoginView,
    RegisterView,
    LogoutView,
    ForgotPasswordView,
    PasswordResetView,
    CurrentUserView
)

app_name = 'users'

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', PasswordResetView.as_view(), name='reset-password'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]
