"""
Serializers cho Giỏ hàng - Cart Serializers
"""

from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.serializers import ProductVariantSerializer


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer cho sản phẩm trong giỏ hàng"""
    
    variant = ProductVariantSerializer(read_only=True)
    variant_id = serializers.IntegerField(write_only=True)
    total_price = serializers.DecimalField(
        source='get_total_price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    product_slug = serializers.CharField(source='variant.product.slug', read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'variant', 'variant_id', 'quantity',
            'price_at_addition', 'total_price',
            'product_name', 'product_slug',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'price_at_addition', 'created_at', 'updated_at']
    
    def validate_variant_id(self, value):
        """Kiểm tra variant có tồn tại và active"""
        from apps.products.models import ProductVariant
        
        try:
            variant = ProductVariant.objects.get(pk=value, is_active=True)
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.")
        
        return value
    
    def validate_quantity(self, value):
        """Kiểm tra số lượng"""
        if value < 1:
            raise serializers.ValidationError("Số lượng phải lớn hơn 0.")
        
        return value
    
    def validate(self, data):
        """Kiểm tra tồn kho"""
        from apps.products.models import ProductVariant
        
        variant_id = data.get('variant_id')
        quantity = data.get('quantity', 1)
        
        variant = ProductVariant.objects.get(pk=variant_id)
        
        if variant.stock < quantity:
            raise serializers.ValidationError({
                'quantity': f"Chỉ còn {variant.stock} sản phẩm trong kho."
            })
        
        return data


class CartSerializer(serializers.ModelSerializer):
    """Serializer cho giỏ hàng"""
    
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(source='get_total_items', read_only=True)
    subtotal = serializers.DecimalField(
        source='get_subtotal',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'session_key', 'items', 'total_items', 'subtotal', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'session_key', 'created_at', 'updated_at']
