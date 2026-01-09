"""
Voucher/Discount Code Models
Handles discount codes, promotional vouchers, and coupon logic
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class VoucherType(models.TextChoices):
    """Types of voucher discounts"""
    PERCENTAGE = 'PERCENTAGE', 'Phần trăm'
    FIXED_AMOUNT = 'FIXED_AMOUNT', 'Số tiền cố định'
    FREE_SHIPPING = 'FREE_SHIPPING', 'Miễn phí vận chuyển'


class Voucher(models.Model):
    """
    Voucher/Discount Code Model
    
    Supports:
    - Percentage discounts (e.g., 10% off)
    - Fixed amount discounts (e.g., 50,000 VNĐ off)
    - Free shipping
    - Usage limits (total and per-user)
    - Validity periods
    - Minimum order value requirements
    """
    
    code = models.CharField(
        max_length=50, 
        unique=True, 
        db_index=True,
        verbose_name='Mã voucher',
        help_text='Mã voucher duy nhất (sẽ tự động chuyển thành chữ hoa)'
    )
    description = models.TextField(
        blank=True, 
        verbose_name='Mô tả',
        help_text='Mô tả chi tiết về voucher'
    )
    
    # Discount Configuration
    discount_type = models.CharField(
        max_length=20,
        choices=VoucherType.choices,
        verbose_name='Loại giảm giá'
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Giá trị giảm',
        help_text='Phần trăm (1-100) hoặc Số tiền (VNĐ)'
    )
    
    # Usage Constraints
    min_order_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Giá trị đơn hàng tối thiểu',
        help_text='Đơn hàng phải đạt giá trị này để áp dụng voucher'
    )
    max_discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Giảm tối đa',
        help_text='Áp dụng cho voucher phần trăm - giới hạn số tiền giảm tối đa'
    )
    
    # Usage Limits
    usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Số lần sử dụng tối đa',
        help_text='Để trống nếu không giới hạn'
    )
    usage_per_user = models.PositiveIntegerField(
        default=1,
        verbose_name='Số lần sử dụng/người dùng',
        help_text='Số lần tối đa mỗi người dùng có thể sử dụng voucher này'
    )
    times_used = models.PositiveIntegerField(
        default=0,
        editable=False,
        verbose_name='Đã sử dụng',
        help_text='Số lần voucher đã được sử dụng'
    )
    
    # Validity Period
    valid_from = models.DateTimeField(
        verbose_name='Có hiệu lực từ',
        help_text='Ngày bắt đầu có hiệu lực'
    )
    valid_until = models.DateTimeField(
        verbose_name='Hết hạn',
        help_text='Ngày hết hạn'
    )
    
    # Status
    is_active = models.BooleanField(
        default=True, 
        verbose_name='Kích hoạt',
        help_text='Tắt để vô hiệu hóa voucher mà không cần xóa'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật lần cuối')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_vouchers',
        verbose_name='Người tạo'
    )
    
    class Meta:
        db_table = 'vouchers'
        ordering = ['-created_at']
        verbose_name = 'Voucher'
        verbose_name_plural = 'Vouchers'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'valid_from', 'valid_until']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.get_discount_type_display()}"
    
    def save(self, *args, **kwargs):
        """Convert code to uppercase before saving"""
        if self.code:
            self.code = self.code.upper()
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """
        Check if voucher is currently valid
        
        Returns:
            bool: True if voucher can be used
        """
        now = timezone.now()
        
        # Check if active
        if not self.is_active:
            return False
        
        # Check validity period
        if not (self.valid_from <= now <= self.valid_until):
            return False
        
        # Check usage limit
        if self.usage_limit is not None and self.times_used >= self.usage_limit:
            return False
        
        return True
    
    def can_use(self, user, order_total):
        """
        Check if user can use this voucher for given order total
        
        Args:
            user: User instance (can be None for guest)
            order_total: Decimal - order subtotal
        
        Returns:
            tuple: (bool, str) - (can_use, error_message)
        """
        # Basic validity check
        if not self.is_valid():
            if not self.is_active:
                return False, "Voucher không còn hoạt động"
            
            now = timezone.now()
            if now < self.valid_from:
                return False, f"Voucher chưa có hiệu lực (từ {self.valid_from.strftime('%d/%m/%Y')})"
            if now > self.valid_until:
                return False, "Voucher đã hết hạn"
            if self.usage_limit and self.times_used >= self.usage_limit:
                return False, "Voucher đã hết lượt sử dụng"
        
        # Check minimum order value
        if order_total < self.min_order_value:
            return False, f"Đơn hàng tối thiểu {self.min_order_value:,.0f} VNĐ"
        
        # Check per-user usage limit
        if user:
            from apps.orders.models import Order
            user_usage = Order.objects.filter(
                user=user,
                applied_vouchers=self
            ).exclude(
                status__in=['CANCELED', 'PROCESSING_FAILED']  # Don't count failed/canceled orders
            ).count()
            
            if user_usage >= self.usage_per_user:
                return False, f"Bạn đã sử dụng voucher này {self.usage_per_user} lần (tối đa)"
        
        return True, ""
    
    def calculate_discount(self, order_total, shipping_cost):
        """
        Calculate discount amount for given order
        
        Args:
            order_total: Decimal - order subtotal (before shipping and discounts)
            shipping_cost: Decimal - shipping cost
        
        Returns:
            Decimal: Discount amount to apply
        """
        if self.discount_type == VoucherType.PERCENTAGE:
            # Calculate percentage discount
            discount = (order_total * self.discount_value) / Decimal('100')
            
            # Apply max discount cap if specified
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            
            return discount.quantize(Decimal('0.01'))
        
        elif self.discount_type == VoucherType.FIXED_AMOUNT:
            # Fixed amount discount (cannot exceed order total)
            return min(self.discount_value, order_total).quantize(Decimal('0.01'))
        
        elif self.discount_type == VoucherType.FREE_SHIPPING:
            # Free shipping discount
            return shipping_cost.quantize(Decimal('0.01'))
        
        return Decimal('0.00')
    
    def get_discount_display(self):
        """Get human-readable discount description"""
        if self.discount_type == VoucherType.PERCENTAGE:
            display = f"{self.discount_value}% giảm"
            if self.max_discount_amount:
                display += f" (tối đa {self.max_discount_amount:,.0f}₫)"
            return display
        
        elif self.discount_type == VoucherType.FIXED_AMOUNT:
            return f"{self.discount_value:,.0f}₫ giảm"
        
        elif self.discount_type == VoucherType.FREE_SHIPPING:
            return "Miễn phí vận chuyển"
        
        return "Unknown"
    
    def increment_usage(self):
        """Increment usage counter (thread-safe)"""
        from django.db.models import F
        Voucher.objects.filter(pk=self.pk).update(times_used=F('times_used') + 1)
        self.refresh_from_db()
