"""
Admin interface for Payment models
"""

from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin interface for Payment model"""
    
    list_display = [
        'transaction_id',
        'order',
        'payment_method',
        'amount',
        'status',
        'created_at',
        'completed_at'
    ]
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['transaction_id', 'gateway_transaction_id', 'order__order_number']
    readonly_fields = ['id', 'created_at', 'updated_at', 'response_data']
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('id', 'order', 'payment_method', 'amount', 'status')
        }),
        ('Thông tin giao dịch', {
            'fields': ('transaction_id', 'gateway_transaction_id', 'response_data')
        }),
        ('Thông tin bổ sung', {
            'fields': ('note', 'created_at', 'updated_at', 'completed_at')
        }),
    )
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of payment records"""
        return False
