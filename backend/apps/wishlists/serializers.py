"""
Serializers cho Wishlist - Danh sách yêu thích
"""

from rest_framework import serializers
from .models import Wishlist, WishlistItem
from apps.products.serializers import ProductListSerializer, ProductVariantSerializer


class WishlistItemSerializer(serializers.ModelSerializer):
    """Serializer cho sản phẩm trong wishlist"""
    
    product = ProductListSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    variant_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'variant', 'product_id', 'variant_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_product_id(self, value):
        """Kiểm tra product có tồn tại"""
        from apps.products.models import Product
        
        try:
            Product.objects.get(pk=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.")
        
        return value
    
    def validate_variant_id(self, value):
        """Kiểm tra variant có tồn tại nếu được cung cấp"""
        if value is None:
            return value
            
        from apps.products.models import ProductVariant
        
        try:
            ProductVariant.objects.get(pk=value, is_active=True)
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError("Biến thể sản phẩm không tồn tại.")
        
        return value


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer cho wishlist"""
    
    items = WishlistItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(source='get_total_items', read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'items', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
