"""
URL Configuration for Payments API
"""

from django.urls import path
from .views import (
    VNPayPaymentCreateView,
    VNPayReturnView,
    VNPayIPNView,
    PaymentListView
)

app_name = 'payments'

urlpatterns = [
    # VNPAY endpoints
    path('vnpay/create/', VNPayPaymentCreateView.as_view(), name='vnpay-create'),
    path('vnpay/return/', VNPayReturnView.as_view(), name='vnpay-return'),
    path('vnpay/ipn/', VNPayIPNView.as_view(), name='vnpay-ipn'),
    
    # Payment listing
    path('', PaymentListView.as_view(), name='payment-list'),
]
