from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductVariant, ProductMedia, ProductReview


class ProductMediaInline(admin.TabularInline):
    """Inline for managing product media"""
    model = ProductMedia
    extra = 1
    fields = ('media_type', 'original_file', 'alt_text', 'display_order', 'is_processed', 'processing_status')
    readonly_fields = ('is_processed', 'processing_status')


class ProductVariantInline(admin.TabularInline):
    """Inline for managing product variants"""
    model = ProductVariant
    extra = 1
    fields = ('sku', 'color', 'size', 'lens_type', 'material', 'price', 'sale_price', 'stock', 'is_active', 'is_default')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin for Product Categories"""
    list_display = ('name', 'parent', 'is_active', 'display_order', 'created_at')
    list_filter = ('is_active', 'parent')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('display_order', 'name')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin for Products"""
    list_display = ('name', 'category', 'brand', 'base_price', 'is_active', 'is_featured', 'view_count', 'created_at')
    list_filter = ('is_active', 'is_featured', 'is_new_arrival', 'is_best_seller', 'category', 'brand', 'target_gender')
    search_fields = ('name', 'sku_prefix', 'brand', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('view_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'sku_prefix', 'category', 'brand', 'target_gender')
        }),
        ('Description', {
            'fields': ('short_description', 'description')
        }),
        ('Pricing & Display', {
            'fields': ('base_price', 'is_active', 'is_featured', 'is_new_arrival', 'is_best_seller')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
        ('Analytics', {
            'fields': ('view_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ProductVariantInline, ProductMediaInline]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    """Admin for Product Variants"""
    list_display = ('sku', 'product', 'color', 'size', 'lens_type', 'price', 'sale_price', 'stock', 'stock_status', 'is_active')
    list_filter = ('is_active', 'lens_type', 'material', 'size', 'product__category')
    search_fields = ('sku', 'product__name', 'color')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Product Reference', {
            'fields': ('product', 'sku', 'is_default')
        }),
        ('Variant Attributes', {
            'fields': ('color', 'color_hex', 'material', 'lens_type', 'size')
        }),
        ('Dimensions', {
            'fields': ('lens_width', 'bridge_width', 'temple_length'),
            'classes': ('collapse',)
        }),
        ('Pricing', {
            'fields': ('price', 'sale_price', 'cost_price')
        }),
        ('Inventory', {
            'fields': ('stock', 'low_stock_threshold', 'weight')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def stock_status(self, obj):
        """Visual indicator for stock status"""
        if obj.is_out_of_stock():
            return format_html('<span style="color: red; font-weight: bold;">OUT OF STOCK</span>')
        elif obj.is_low_stock():
            return format_html('<span style="color: orange; font-weight: bold;">LOW STOCK</span>')
        else:
            return format_html('<span style="color: green;">In Stock</span>')
    stock_status.short_description = 'Stock Status'


@admin.register(ProductMedia)
class ProductMediaAdmin(admin.ModelAdmin):
    """Admin for Product Media"""
    list_display = ('id', 'product', 'variant', 'media_type', 'display_order', 'is_processed', 'processing_status', 'created_at')
    list_filter = ('media_type', 'is_processed', 'processing_status', 'product')
    search_fields = ('product__name', 'alt_text', 'title')
    readonly_fields = ('is_processed', 'processing_status', 'processing_error', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Media', {
            'fields': ('product', 'variant', 'media_type', 'original_file')
        }),
        ('Processed Files', {
            'fields': ('processed_images', 'processed_video', 'video_thumbnail'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('alt_text', 'title', 'display_order')
        }),
        ('Processing Status', {
            'fields': ('is_processed', 'processing_status', 'processing_error')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    """Admin for Product Reviews"""
    list_display = ('product', 'user', 'rating', 'is_verified_purchase', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_approved', 'is_verified_purchase', 'created_at')
    search_fields = ('product__name', 'user__email', 'title', 'comment')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Review', {
            'fields': ('product', 'user', 'rating', 'title', 'comment')
        }),
        ('Status', {
            'fields': ('is_verified_purchase', 'is_approved')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
