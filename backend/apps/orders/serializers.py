"""
Serializers for Cart and Orders API
"""

from rest_framework import serializers
from decimal import Decimal
from .models import Order, OrderItem, ShippingAddress
from apps.products.serializers import ProductVariantSerializer

class ShippingAddressSerializer(serializers.ModelSerializer):
    """Serializer for Shipping Address"""
    
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    
    class Meta:
        model = ShippingAddress
        fields = [
            'id', 'full_name', 'phone', 'address_line1', 'address_line2',
            'ward', 'district', 'city', 'postal_code', 'country',
            'full_address', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for Order Items"""
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'variant_sku', 'variant_details',
            'unit_price', 'quantity', 'total_price', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for order listing"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display',
            'payment_status', 'payment_status_display',
            'payment_method', 'payment_method_display',
            'total', 'item_count', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'created_at']
    
    def get_item_count(self, obj):
        return obj.items.count()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single order view"""
    
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'email', 'phone',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display', 'payment_transaction_id',
            'subtotal', 'shipping_cost', 'discount_amount', 'total',
            'customer_note', 'items', 'shipping_address',
            'created_at', 'updated_at', 'confirmed_at', 'shipped_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'user', 'status', 'payment_status',
            'payment_transaction_id', 'created_at', 'updated_at',
            'confirmed_at', 'shipped_at', 'completed_at'
        ]


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating orders from cart"""
    
    # Shipping information
    shipping_full_name = serializers.CharField(max_length=200)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_address_line1 = serializers.CharField(max_length=300)
    shipping_address_line2 = serializers.CharField(max_length=300, required=False, allow_blank=True)
    shipping_ward = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_district = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_country = serializers.CharField(max_length=100, default='Vietnam')
    
    # Contact (defaults to shipping if not provided)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    
    # Payment
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    
    # Optional
    customer_note = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Additional validation"""
        # Ensure cart exists and has items
        cart = self.context.get('cart')
        if not cart or cart.get_total_items() == 0:
            raise serializers.ValidationError("Cart is empty.")
        
        return data
