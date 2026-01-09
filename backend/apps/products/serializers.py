"""
Serializers for Products API
"""

from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductMedia, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Categories"""
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'parent', 'image',
            'is_active', 'display_order', 'meta_title', 'meta_description'
        ]
        read_only_fields = ['id']


class ProductMediaSerializer(serializers.ModelSerializer):
    """Serializer for Product Media"""
    
    # Provide direct URLs for processed images
    thumbnail_url = serializers.SerializerMethodField()
    medium_url = serializers.SerializerMethodField()
    large_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductMedia
        fields = [
            'id', 'media_type', 'original_file', 'processed_images',
            'thumbnail_url', 'medium_url', 'large_url',
            'processed_video', 'video_thumbnail', 'alt_text',
            'title', 'display_order', 'is_processed'
        ]
        read_only_fields = ['id', 'processed_images', 'is_processed']
    
    def get_thumbnail_url(self, obj):
        if obj.processed_images and 'thumbnail' in obj.processed_images:
            return obj.processed_images['thumbnail']
        return None
    
    def get_medium_url(self, obj):
        if obj.processed_images and 'medium' in obj.processed_images:
            return obj.processed_images['medium']
        return None
    
    def get_large_url(self, obj):
        if obj.processed_images and 'large' in obj.processed_images:
            return obj.processed_images['large']
        return None


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for Product Variants"""
    
    # Include variant-specific media
    media = ProductMediaSerializer(many=True, read_only=True)
    
    # Product information for better UX in admin
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    
    # Computed fields
    display_price = serializers.DecimalField(
        source='get_display_price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(
        source='get_discount_percentage',
        read_only=True
    )
    stock_status = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'product_name', 'product_brand',
            'color', 'color_hex', 'material', 'lens_type', 'size',
            'lens_width', 'bridge_width', 'temple_length',
            'price', 'sale_price', 'display_price', 'is_on_sale', 'discount_percentage',
            'stock', 'stock_status', 'weight', 'is_active', 'is_default', 'media'
        ]
        read_only_fields = ['id', 'display_price', 'is_on_sale', 'discount_percentage']
    
    def get_stock_status(self, obj):
        """Return stock availability status"""
        if obj.is_out_of_stock():
            return 'out_of_stock'
        elif obj.is_low_stock():
            return 'low_stock'
        else:
            return 'in_stock'


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product listings"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    default_variant = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    price_range = serializers.SerializerMethodField()
    in_stock = serializers.BooleanField(source='is_in_stock', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'category_name', 'short_description',
            'base_price', 'price_range', 'thumbnail', 'default_variant',
            'is_active', 'is_featured', 'is_new_arrival', 'is_best_seller',
            'in_stock', 'view_count'
        ]
        read_only_fields = ['id', 'view_count']
    
    def get_default_variant(self, obj):
        """Get default variant info"""
        default = obj.variants.filter(is_default=True, is_active=True).first()
        if default:
            return {
                'id': default.id,
                'sku': default.sku,
                'color': default.color,
                'price': default.price,
                'sale_price': default.sale_price,
                'display_price': default.get_display_price(),
            }
        return None
    
    def get_thumbnail(self, obj):
        """Get first product image thumbnail"""
        media = obj.media.filter(media_type='image', is_processed=True).first()
        if media and media.processed_images and 'thumbnail' in media.processed_images:
            return media.processed_images['thumbnail']
        return None
    
    def get_price_range(self, obj):
        """Get price range from variants"""
        return obj.get_price_range()


class ProductDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single product view"""
    
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    media = ProductMediaSerializer(many=True, read_only=True)
    price_range = serializers.SerializerMethodField()
    total_stock = serializers.IntegerField(source='get_total_stock', read_only=True)
    in_stock = serializers.BooleanField(source='is_in_stock', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku_prefix', 'category', 'brand',
            'short_description', 'description', 'target_gender',
            'base_price', 'price_range', 'total_stock', 'in_stock',
            'is_active', 'is_featured', 'is_new_arrival', 'is_best_seller',
            'meta_title', 'meta_description', 'meta_keywords',
            'view_count', 'variants', 'media', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'created_at', 'updated_at']
    
    def get_price_range(self, obj):
        """Get min and max price from active variants"""
        return obj.get_price_range()


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for Product Reviews"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'user', 'user_name', 'user_avatar',
            'rating', 'title', 'comment', 'is_verified_purchase',
            'is_approved', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'is_verified_purchase', 'is_approved', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Auto-set user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
