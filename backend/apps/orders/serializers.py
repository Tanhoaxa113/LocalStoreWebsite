"""
Order API Serializers
Handles JSON serialization for Order Management APIs
"""

from rest_framework import serializers
from apps.orders.models import (
    Order, OrderItem, ShippingAddress, OrderStatusHistory, 
    Voucher, OrderStatus
)
from apps.users.models import User
from decimal import Decimal


class VoucherSerializer(serializers.ModelSerializer):
    """Serializer for Voucher model"""
    
    discount_display = serializers.CharField(source='get_discount_display', read_only=True)
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'discount_display', 'min_order_value', 'max_discount_amount',
            'usage_limit', 'usage_per_user', 'times_used',
            'valid_from', 'valid_until', 'is_active', 'is_valid',
            'created_at'
        ]
        read_only_fields = ['times_used', 'created_at']
    
    def get_is_valid(self, obj):
        """Check if voucher is currently valid"""
        return obj.is_valid()


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem"""
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'variant_sku', 'variant_details',
            'unit_price', 'quantity', 'total_price'
        ]


class ShippingAddressSerializer(serializers.ModelSerializer):
    """Serializer for ShippingAddress"""
    
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    
    class Meta:
        model = ShippingAddress
        fields = [
            'full_name', 'phone', 'address_line1', 'address_line2',
            'ward', 'district', 'city', 'postal_code', 'country',
            'full_address'
        ]


class StatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for OrderStatusHistory"""
    
    changed_by_email = serializers.EmailField(source='changed_by.email', read_only=True, allow_null=True)
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True, allow_null=True)
    from_status_display = serializers.SerializerMethodField()
    to_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'from_status', 'from_status_display', 
            'to_status', 'to_status_display',
            'note', 'changed_by_email', 'changed_by_name', 'created_at'
        ]
    
    def get_from_status_display(self, obj):
        """Get display label for from_status"""
        try:
            return OrderStatus(obj.from_status).label
        except ValueError:
            return obj.from_status
    
    def get_to_status_display(self, obj):
        """Get display label for to_status"""
        try:
            return OrderStatus(obj.to_status).label
        except ValueError:
            return obj.to_status


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order list view"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    customer_name = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'email', 'phone',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display',
            'total', 'item_count', 'created_at', 'updated_at'
        ]
    
    def get_customer_name(self, obj):
        """Get customer name from user or shipping address"""
        if obj.user:
            return obj.user.get_full_name()
        # Fallback to shipping address if available
        if hasattr(obj, 'shipping_address'):
            return obj.shipping_address.full_name
        return 'Guest'
    
    def get_item_count(self, obj):
        """Get total number of items in order"""
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single order view"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    status_history = StatusHistorySerializer(many=True, read_only=True)
    applied_vouchers = VoucherSerializer(many=True, read_only=True)
    
    # Capability flags
    can_cancel = serializers.BooleanField(read_only=True)
    can_confirm = serializers.BooleanField(read_only=True)
    can_mark_delivering = serializers.BooleanField(read_only=True)
    can_mark_delivered = serializers.BooleanField(read_only=True)
    can_request_refund = serializers.BooleanField(read_only=True)
    
    # Payment retry support
    can_retry_payment = serializers.SerializerMethodField()
    time_until_expiration = serializers.SerializerMethodField()
    
    # Customer info
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'email', 'phone',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display', 'payment_transaction_id',
            'subtotal', 'shipping_cost', 'discount_amount', 'total',
            'tracking_number', 'carrier', 'customer_note', 'admin_note',
            'refund_reason', 'cancellation_reason', 'processing_notes',
            'items', 'shipping_address', 'status_history', 'applied_vouchers',
            'can_cancel', 'can_confirm', 'can_mark_delivering', 
            'can_mark_delivered', 'can_request_refund',
            'can_retry_payment', 'time_until_expiration',
            'created_at', 'updated_at',
            'processing_at', 'confirmed_at', 'delivering_at', 'delivered_at',
            'refunded_at', 'completed_at', 'canceled_at'
        ]
    
    def get_customer_name(self, obj):
        """Get customer name"""
        if obj.user:
            return obj.user.get_full_name()
        if hasattr(obj, 'shipping_address'):
            return obj.shipping_address.full_name
        return 'Guest'
    
    def get_can_retry_payment(self, obj):
        """Check if payment can be retried"""
        # Allow retry if order is PENDING, CONFIRMING, or PROCESSING_SUCCESS
        # This accounts for orders that passed validation (auto-moved to CONFIRMING) 
        # but haven't been paid yet.
        allowed_statuses = [
            OrderStatus.PENDING,
            OrderStatus.PROCESSING_SUCCESS,
            OrderStatus.CONFIRMING
        ]
        
        if obj.status not in allowed_statuses:
            return False
            
        # Only VNPAY methods
        if obj.payment_method not in ['vnpay_qr', 'vnpay_card']:
            return False
            
        # Check time window (15 minutes)
        from django.utils import timezone
        from datetime import timedelta
        
        # Payment must be pending or failed (not paid)
        if obj.payment_status == 'paid':
            return False
            
        expiration_time = obj.created_at + timedelta(minutes=15)
        now = timezone.now()
        
        return now < expiration_time

    def get_time_until_expiration(self, obj):
        """Get seconds until order expires (for pending orders)"""
        if obj.status != OrderStatus.PENDING:
            return None
            
        from django.utils import timezone
        from datetime import timedelta
        
        expiration_time = obj.created_at + timedelta(minutes=15)
        now = timezone.now()
        
        if now > expiration_time:
            return 0
            
        remaining = (expiration_time - now).total_seconds()
        return int(remaining)


class OrderStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    
    # Today's stats
    total_orders_today = serializers.IntegerField()
    revenue_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Pending actions
    pending_confirmation_count = serializers.IntegerField()
    pending_refund_count = serializers.IntegerField()
    ready_to_ship_count = serializers.IntegerField()
    
    # Overall stats
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Status breakdown
    status_breakdown = serializers.DictField()


class ConfirmOrderSerializer(serializers.Serializer):
    """Serializer for confirming an order"""
    
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)


class ShipOrderSerializer(serializers.Serializer):
    """Serializer for marking order as delivering"""
    
    tracking_number = serializers.CharField(required=True, max_length=100)
    carrier = serializers.CharField(required=True, max_length=100)
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)


class DeliverOrderSerializer(serializers.Serializer):
    """Serializer for marking order as delivered"""
    
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)


class CancelOrderSerializer(serializers.Serializer):
    """Serializer for canceling an order"""
    
    reason = serializers.CharField(required=True, max_length=500)


class ApproveRefundSerializer(serializers.Serializer):
    """Serializer for approving refund"""
    
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)


class RejectRefundSerializer(serializers.Serializer):
    """Serializer for rejecting refund"""
    
    reason = serializers.CharField(required=True, max_length=500)


class RequestRefundSerializer(serializers.Serializer):
    """Serializer for customer requesting refund"""
    
    reason = serializers.CharField(required=True, max_length=500)
