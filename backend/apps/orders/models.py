"""
Order Models - Only Order-related logic (No Cart!)
Cart logic is in apps/carts
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class OrderStatus(models.TextChoices):
    """
    Comprehensive Order Status Enum
    Represents the complete order lifecycle from creation to completion/cancellation
    """
    # Initial state
    PENDING = 'PENDING', 'Chờ xác nhận'
    
    # Processing states (automated validation)
    PROCESSING = 'PROCESSING', 'Đang xử lý'
    PROCESSING_SUCCESS = 'PROCESSING_SUCCESS', 'Xử lý thành công'
    PROCESSING_FAILED = 'PROCESSING_FAILED', 'Xử lý thất bại'
    
    # Confirmation state (awaiting staff action)
    CONFIRMING = 'CONFIRMING', 'Chờ xác nhận'
    CONFIRMED = 'CONFIRMED', 'Đã xác nhận'
    
    # Fulfillment states
    DELIVERING = 'DELIVERING', 'Đang giao hàng'
    DELIVERED = 'DELIVERED', 'Giao thành công'
    
    # Refund states
    REFUND_REQUESTED = 'REFUND_REQUESTED', 'Đã gửi yêu cầu hoàn tiền'
    REFUNDING = 'REFUNDING', 'Đang hoàn tiền'
    REFUNDED = 'REFUNDED', 'Đã hoàn tiền'
    
    # Terminal states
    COMPLETED = 'COMPLETED', 'Hoàn thành'
    CANCELED = 'CANCELED', 'Đã hủy'


# State Machine Transition Rules
ALLOWED_TRANSITIONS = {
    OrderStatus.PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELED, OrderStatus.REFUNDING],
    OrderStatus.PROCESSING: [OrderStatus.PROCESSING_SUCCESS, OrderStatus.PROCESSING_FAILED],
    OrderStatus.PROCESSING_SUCCESS: [OrderStatus.CONFIRMING, OrderStatus.CANCELED, OrderStatus.REFUNDING],
    OrderStatus.PROCESSING_FAILED: [OrderStatus.CANCELED, OrderStatus.REFUNDING],
    OrderStatus.CONFIRMING: [OrderStatus.CONFIRMED, OrderStatus.CANCELED, OrderStatus.REFUNDING],
    OrderStatus.CONFIRMED: [OrderStatus.DELIVERING, OrderStatus.CANCELED, OrderStatus.REFUNDING],
    OrderStatus.DELIVERING: [OrderStatus.DELIVERED, OrderStatus.CANCELED, OrderStatus.REFUNDING],
    OrderStatus.DELIVERED: [OrderStatus.COMPLETED, OrderStatus.REFUND_REQUESTED],
    OrderStatus.REFUND_REQUESTED: [OrderStatus.REFUNDING, OrderStatus.DELIVERED],  # Can reject refund
    OrderStatus.REFUNDING: [OrderStatus.REFUNDED],
    OrderStatus.REFUNDED: [],  # Terminal state
    OrderStatus.COMPLETED: [OrderStatus.REFUND_REQUESTED],  # Can request refund after completion
    OrderStatus.CANCELED: [],  # Terminal state
}


class Order(models.Model):
    """
    Đơn hàng - Order Model (Enhanced with comprehensive status tracking)
    """
    
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
        max_length=30,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
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
    
    # ==================== VOUCHER INTEGRATION ====================
    applied_vouchers = models.ManyToManyField(
        'Voucher',
        blank=True,
        related_name='orders',
        verbose_name='Vouchers đã áp dụng'
    )
    
    # ==================== PROCESSING INFO ====================
    processing_notes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Chi tiết xử lý',
        help_text='Stores validation results, error messages, and processing details'
    )
    
    # ==================== SHIPPING INFO ====================
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Mã vận đơn'
    )
    carrier = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Đơn vị vận chuyển'
    )
    
    # Notes
    customer_note = models.TextField(blank=True, verbose_name='Ghi chú của khách hàng')
    admin_note = models.TextField(blank=True, verbose_name='Ghi chú nội bộ')
    refund_reason = models.TextField(blank=True, verbose_name='Lý do hoàn tiền')
    cancellation_reason = models.TextField(blank=True, verbose_name='Lý do hủy đơn')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày đặt hàng')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật lần cuối')
    
    # Status-specific timestamps
    processing_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian bắt đầu xử lý')
    processing_success_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian xử lý thành công')
    processing_failed_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian xử lý thất bại')
    confirming_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian chờ xác nhận')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày xác nhận')
    delivering_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian bắt đầu giao hàng')
    delivered_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian giao thành công')
    refund_requested_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian yêu cầu hoàn tiền')
    refunding_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian bắt đầu hoàn tiền')
    refunded_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian hoàn tiền thành công')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày hoàn thành')
    canceled_at = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian hủy đơn')
    
    # Legacy timestamp fields (kept for backward compatibility)
    shipped_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày giao hàng (legacy)')

    
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
        return self.status in [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING_SUCCESS,
            OrderStatus.DELIVERING,
        ]
    
    def can_refund(self):
        """Kiểm tra có thể hoàn tiền không (legacy method)"""
        return self.can_request_refund()
    
    def can_request_refund(self):
        """
        Kiểm tra có thể yêu cầu hoàn tiền không
        Enhanced version with time-window validation
        """
        from django.conf import settings
        from datetime import timedelta
        
        # Must be paid
        if self.payment_status != 'paid':
            return False
        
        # Must be in completed or delivered state
        if self.status not in [OrderStatus.COMPLETED, OrderStatus.DELIVERED]:
            return False
        
        # Check time window (e.g., 7 days after delivery)
        refund_window_days = getattr(settings, 'REFUND_WINDOW_DAYS', 7)
        
        if self.delivered_at:
            from django.utils import timezone
            cutoff_date = self.delivered_at + timedelta(days=refund_window_days)
            
            if timezone.now() > cutoff_date:
                return False
        
        return True
    
    def can_confirm(self):
        """Kiểm tra có thể xác nhận đơn hàng không"""
        return self.status == OrderStatus.CONFIRMING
    
    def can_mark_delivering(self):
        """Kiểm tra có thể chuyển sang trạng thái giao hàng không"""
        return self.status == OrderStatus.CONFIRMED
    
    def can_mark_delivered(self):
        """Kiểm tra có thể chuyển sang trạng thái đã giao không"""
        return self.status == OrderStatus.DELIVERING
    
    # ==================== STATUS TRANSITION METHODS ====================
    
    def get_allowed_transitions(self):
        """Lấy danh sách trạng thái có thể chuyển đến"""
        return ALLOWED_TRANSITIONS.get(self.status, [])
    
    def can_transition_to(self, new_status):
        """Kiểm tra có thể chuyển sang trạng thái mới không"""
        if isinstance(new_status, str):
            new_status = OrderStatus(new_status)
        return new_status in self.get_allowed_transitions()
    
    def transition_to(self, new_status, actor=None, note=''):
        """
        Chuyển trạng thái đơn hàng với xác thực và ghi lịch sử
        
        Args:
            new_status: OrderStatus enum hoặc string
            actor: User thực hiện chuyển trạng thái
            note: Ghi chú về chuyển trạng thái
        
        Returns:
            bool: True nếu thành công, False nếu thất bại
        """
        if isinstance(new_status, str):
            new_status = OrderStatus(new_status)
        
        if not self.can_transition_to(new_status):
            return False
        
        old_status = self.status
        self.status = new_status
        
        # Tự động cập nhật timestamp tương ứng
        timestamp_field_map = {
            OrderStatus.PROCESSING: 'processing_at',
            OrderStatus.PROCESSING_SUCCESS: 'processing_success_at',
            OrderStatus.PROCESSING_FAILED: 'processing_failed_at',
            OrderStatus.CONFIRMING: 'confirming_at',
            OrderStatus.CONFIRMED: 'confirmed_at',
            OrderStatus.DELIVERING: 'delivering_at',
            OrderStatus.DELIVERED: 'delivered_at',
            OrderStatus.REFUND_REQUESTED: 'refund_requested_at',
            OrderStatus.REFUNDING: 'refunding_at',
            OrderStatus.REFUNDED: 'refunded_at',
            OrderStatus.COMPLETED: 'completed_at',
            OrderStatus.CANCELED: 'canceled_at',
        }
        
        if new_status in timestamp_field_map:
            from django.utils import timezone
            setattr(self, timestamp_field_map[new_status], timezone.now())
        
        self.save()
        
        # Tạo bản ghi lịch sử
        OrderStatusHistory.objects.create(
            order=self,
            from_status=old_status,
            to_status=new_status,
            note=note,
            changed_by=actor
        )
        
        return True

    def cancel_order(self, actor=None, reason=''):
        """Hủy đơn hàng và hoàn lại tồn kho"""
        if not self.can_cancel():
            return False
            
        from django.db import transaction
            
        with transaction.atomic():
            # Hoàn lại tồn kho using the new restore_inventory method
            self.restore_inventory()
            
            # Cập nhật lý do hủy
            self.cancellation_reason = reason
            
            # Chuyển trạng thái
            # Nếu đã thanh toán -> chuyển sang REFUNDING
            # Nếu chưa thanh toán -> chuyển sang CANCELED
            target_status = OrderStatus.CANCELED
            if self.payment_status == 'paid':
                target_status = OrderStatus.REFUNDING
                
            if self.transition_to(target_status, actor=actor, note=reason):
                return True
        
        return False

    def check_expiration(self):
        """Kiểm tra và hủy đơn hàng nếu quá hạn thanh toán (15 phút)"""
        if self.status == OrderStatus.PENDING:
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
    
    def get_processing_time(self):
        """Tính thời gian xử lý đơn hàng (giây)"""
        if self.processing_at and self.processing_success_at:
            return (self.processing_success_at - self.processing_at).total_seconds()
        return None
    
    def get_delivery_time(self):
        """Tính thời gian từ đặt hàng đến giao hàng (giây)"""
        if self.delivered_at:
            return (self.delivered_at - self.created_at).total_seconds()
        return None
    
    def restore_inventory(self):
        """
        Restore inventory when order is canceled or refunded
        
        CRITICAL: Uses select_for_update() to prevent race conditions
        Multiple orders being canceled simultaneously won't cause stock inconsistencies
        """
        from apps.products.models import ProductVariant
        from apps.warehouse.models import InventoryLog
        from django.db import transaction
        
        with transaction.atomic():
            for item in self.items.select_related('variant'):
                if not item.variant:
                    logger.warning(f"Order {self.order_number} item has no variant, skipping inventory restore")
                    continue
                
                # CRITICAL: Lock variant row to prevent concurrent modifications
                # This ensures stock updates are atomic and prevent race conditions
                variant = ProductVariant.objects.select_for_update().get(
                    id=item.variant.id
                )
                
                # Record stock before restoration
                stock_before = variant.stock
                
                # Restore stock
                variant.stock += item.quantity
                variant.save(update_fields=['stock', 'updated_at'])
                
                # Create inventory log for REFUND
                InventoryLog.log_transaction(
                    variant=variant,
                    quantity_change=item.quantity,  # Positive for restoration
                    transaction_type='REFUND',
                    transaction_id=self.order_number,
                    stock_before=stock_before,
                    stock_after=variant.stock,
                    created_by=None,  # System action
                    note=f"Order {'canceled' if self.status == 'CANCELED' else 'refunded'}"
                )
                
                logger.info(
                    f"Restored inventory for order {self.order_number}: "
                    f"{variant.sku} stock {stock_before} -> {variant.stock} (+{item.quantity})"
                )
        
        logger.info(f"Inventory fully restored for order {self.order_number}")



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
    from_status = models.CharField(max_length=30, verbose_name='Trạng thái cũ')
    to_status = models.CharField(max_length=30, verbose_name='Trạng thái mới')
    note = models.TextField(blank=True, verbose_name='Ghi chú')
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
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


# Import Voucher model to make it available in orders app
from apps.orders.vouchers import Voucher, VoucherType

__all__ = [
    'OrderStatus',
    'Order',
    'OrderItem',
    'ShippingAddress',
    'OrderStatusHistory',
    'Voucher',
    'VoucherType',
    'ALLOWED_TRANSITIONS',
]
