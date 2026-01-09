"""
Payment Models for tracking all payment transactions
"""

from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid

User = get_user_model()


class Payment(models.Model):
    """
    Payment Transaction Model
    Tracks all payment attempts and their statuses
    """
    
    STATUS_CHOICES = [
        ('pending', 'Chờ thanh toán'),
        ('processing', 'Đang xử lý'),
        ('success', 'Thành công'),
        ('failed', 'Thất bại'),
        ('cancelled', 'Đã hủy'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('vnpay_qr', 'VNPAY'),
        ('vnpay_card', 'VNPAY'),
        ('banking', 'Chuyển khoản ngân hàng'),
        ('cod', 'Thanh toán khi nhận hàng'),
    ]
    
    # Primary Key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Related Order
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='Đơn hàng'
    )
    
    # Payment Details
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name='Phương thức thanh toán'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Số tiền'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name='Trạng thái'
    )
    
    # Transaction Information
    transaction_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name='Mã giao dịch'
    )
    gateway_transaction_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Mã GD cổng thanh toán'
    )
    
    # VNPAY Response Data (store complete response for debugging/reconciliation)
    response_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Dữ liệu phản hồi'
    )
    
    # Additional Information
    note = models.TextField(
        blank=True,
        verbose_name='Ghi chú'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày hoàn thành')
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        verbose_name = 'Thanh toán'
        verbose_name_plural = 'Thanh toán'
        indexes = [
            models.Index(fields=['transaction_id']),
            models.Index(fields=['order', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction_id} - {self.get_status_display()}"
    
    def mark_success(self, gateway_transaction_id=None, response_data=None):
        """Mark payment as successful"""
        from django.utils import timezone
        
        self.status = 'success'
        self.completed_at = timezone.now()
        if gateway_transaction_id:
            self.gateway_transaction_id = gateway_transaction_id
        if response_data:
            self.response_data = response_data
        self.save()
        
        # Update related order
        if self.order:
            self.order.payment_status = 'paid'
            self.order.payment_transaction_id = gateway_transaction_id or self.transaction_id
            self.order.save()
    
    def mark_failed(self, response_data=None, note=''):
        """Mark payment as failed"""
        from django.utils import timezone
        
        self.status = 'failed'
        self.completed_at = timezone.now()
        if response_data:
            self.response_data = response_data
        if note:
            self.note = note
        self.save()
        
        # Update related order
        if self.order:
            self.order.payment_status = 'failed'
            self.order.save()
    
    def mark_cancelled(self, note=''):
        """Mark payment as cancelled"""
        from django.utils import timezone
        
        self.status = 'cancelled'
        self.completed_at = timezone.now()
        if note:
            self.note = note
        self.save()
