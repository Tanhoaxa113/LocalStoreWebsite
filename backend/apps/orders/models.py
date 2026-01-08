"""
Order Models - Only Order-related logic (No Cart!)
Cart logic is in apps/carts
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid

User = get_user_model()


class Order(models.Model):
    """
    Đơn hàng - Order Model
    """
    
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('confirmed', 'Đã xác nhận'),
        ('processing', 'Đang xử lý'),
        ('shipping', 'Đang giao hàng'),
        ('completed', 'Hoàn thành'),
        ('cancelled', 'Đã hủy'),
        ('refunded', 'Đã hoàn tiền'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('vnpay_qr', 'VNPAY - Quét mã QR'),
        ('vnpay_card', 'VNPAY - Thẻ ngân hàng'),
        ('banking', 'Chuyển khoản ngân hàng'),
        ('cod', 'Thanh toán khi nhận hàng (COD)'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Chờ thanh toán'),
        ('paid', 'Đã thanh toán'),
        ('failed', 'Thanh toán thất bại'),
        ('refunded', 'Đã hoàn tiền'),
    ]
    
    # Order ID
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Mã đơn hàng')
    
    # Customer
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='orders',
        verbose_name='Khách hàng'
    )
    email = models.EmailField(verbose_name='Email')
    phone = models.CharField(max_length=20, verbose_name='Số điện thoại')
    
    # Order Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name='Trạng thái đơn hàng'
    )
    
    # Payment
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name='Phương thức thanh toán'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        db_index=True,
        verbose_name='Trạng thái thanh toán'
    )
    payment_transaction_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Mã giao dịch'
    )
    
    # Pricing
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Tổng tiền hàng'
    )
    shipping_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Phí vận chuyển'
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Giảm giá'
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Tổng thanh toán'
    )
    
    # Notes
    customer_note = models.TextField(blank=True, verbose_name='Ghi chú của khách hàng')
    admin_note = models.TextField(blank=True, verbose_name='Ghi chú nội bộ')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày đặt hàng')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật lần cuối')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày xác nhận')
    shipped_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày giao hàng')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày hoàn thành')
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        verbose_name = 'Đơn hàng'
        verbose_name_plural = 'Đơn hàng'
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
        ]
    
    def __str__(self):
        return f"Đơn hàng #{self.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number: DH + timestamp + random
            import time
            import random
            timestamp = int(time.time())
            random_suffix = random.randint(1000, 9999)
            self.order_number = f"DH{timestamp}{random_suffix}"
        super().save(*args, **kwargs)
    
    def can_cancel(self):
        """Kiểm tra có thể hủy đơn hàng không"""
        return self.status in ['pending', 'confirmed']
    
    def can_refund(self):
        """Kiểm tra có thể hoàn tiền không"""
        return self.status in ['completed'] and self.payment_status == 'paid'

    def cancel_order(self, reason=''):
        """Hủy đơn hàng và hoàn lại tồn kho"""
        if not self.can_cancel():
            return False
            
        from django.db import transaction
            
        with transaction.atomic():
            # Hoàn lại tồn kho
            for item in self.items.all():
                if item.variant:
                    item.variant.stock += item.quantity
                    item.variant.save()
            
            # Cập nhật trạng thái
            self.status = 'cancelled'
            if reason:
                 self.admin_note = (self.admin_note + f"\n[System] {reason}").strip()
            self.save()
            
        return True

    def check_expiration(self):
        """Kiểm tra và hủy đơn hàng nếu quá hạn thanh toán (15 phút)"""
        if self.status == 'pending':
            from django.utils import timezone
            from datetime import timedelta
            
            expiration_time = self.created_at + timedelta(minutes=15)
            if timezone.now() > expiration_time:
                # Hủy đơn hàng và cập nhật trạng thái thanh toán thành thất bại
                if self.cancel_order(reason="Tự động hủy do quá hạn thanh toán (15 phút)"):
                    self.payment_status = 'failed'
                    self.save(update_fields=['payment_status'])
                return True
        return False


class OrderItem(models.Model):
    """
    Sản phẩm trong đơn hàng
    Snapshot tại thời điểm đặt hàng
    """
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Đơn hàng'
    )
    
    # Product snapshot
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Biến thể sản phẩm'
    )
    product_name = models.CharField(max_length=255, verbose_name='Tên sản phẩm')
    variant_sku = models.CharField(max_length=100, verbose_name='Mã SKU')
    variant_details = models.JSONField(verbose_name='Chi tiết biến thể')
    
    # Pricing snapshot
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Giá đơn vị'
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Số lượng'
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Thành tiền'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'order_items'
        verbose_name = 'Sản phẩm trong đơn hàng'
        verbose_name_plural = 'Sản phẩm trong đơn hàng'
        indexes = [
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"{self.product_name} ({self.variant_sku}) x{self.quantity}"


class ShippingAddress(models.Model):
    """
    Địa chỉ giao hàng
    """
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='shipping_address',
        verbose_name='Đơn hàng'
    )
    
    full_name = models.CharField(max_length=200, verbose_name='Họ và tên')
    phone = models.CharField(max_length=20, verbose_name='Số điện thoại')
    address_line1 = models.CharField(max_length=300, verbose_name='Địa chỉ')
    address_line2 = models.CharField(max_length=300, blank=True, verbose_name='Địa chỉ bổ sung')
    ward = models.CharField(max_length=100, blank=True, verbose_name='Phường/Xã')
    district = models.CharField(max_length=100, blank=True, verbose_name='Quận/Huyện')
    city = models.CharField(max_length=100, verbose_name='Tỉnh/Thành phố')
    postal_code = models.CharField(max_length=20, blank=True, verbose_name='Mã bưu điện')
    country = models.CharField(max_length=100, default='Vietnam', verbose_name='Quốc gia')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'shipping_addresses'
        verbose_name = 'Địa chỉ giao hàng'
        verbose_name_plural = 'Địa chỉ giao hàng'
    
    def __str__(self):
        return f"{self.full_name} - {self.address_line1}, {self.city}"
    
    def get_full_address(self):
        parts = [self.address_line1]
        if self.address_line2: parts.append(self.address_line2)
        if self.ward: parts.append(self.ward)
        if self.district: parts.append(self.district)
        parts.append(self.city)
        if self.postal_code: parts.append(self.postal_code)
        return ', '.join(parts)


class OrderStatusHistory(models.Model):
    """
    Lịch sử thay đổi trạng thái đơn hàng
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name='Đơn hàng'
    )
    from_status = models.CharField(max_length=20, verbose_name='Trạng thái cũ')
    to_status = models.CharField(max_length=20, verbose_name='Trạng thái mới')
    note = models.TextField(blank=True, verbose_name='Ghi chú')
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Người thay đổi'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Thời gian')
    
    class Meta:
        db_table = 'order_status_history'
        ordering = ['-created_at']
        verbose_name = 'Lịch sử trạng thái'
        verbose_name_plural = 'Lịch sử trạng thái'
    
    def __str__(self):
        return f"{self.from_status} → {self.to_status}"
