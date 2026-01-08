"""
Admin interface cho Giỏ hàng
"""

from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('price_at_addition', 'created_at', 'updated_at')
    fields = ('variant', 'quantity', 'price_at_addition', 'get_total_price')
    
    def get_total_price(self, obj):
        if obj.pk:
            return f"{obj.get_total_price():,.0f} ₫"
        return "-"
    get_total_price.short_description = "Tổng tiền"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email', 'session_key_display', 'total_items', 'subtotal_display', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__email', 'session_key')
    readonly_fields = ('id', 'created_at', 'updated_at', 'total_items', 'subtotal_display')
    inlines = [CartItemInline]
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('id', 'user', 'session_key')
        }),
        ('Tổng quan', {
            'fields': ('total_items', 'subtotal_display')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        return obj.user.email if obj.user else "Khách"
    user_email.short_description = "Người dùng"
    user_email.admin_order_field = 'user__email'
    
    def session_key_display(self, obj):
        if obj.session_key:
            return f"{obj.session_key[:12]}..."
        return "-"
    session_key_display.short_description = "Session"
    
    def total_items(self, obj):
        return obj.get_total_items()
    total_items.short_description = "Số sản phẩm"
    
    def subtotal_display(self, obj):
        return f"{obj.get_subtotal():,.0f} ₫"
    subtotal_display.short_description = "Tổng tiền"


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart_owner', 'product_name', 'variant_info', 'quantity', 'total_price_display', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('cart__user__email', 'variant__product__name', 'variant__sku')
    readonly_fields = ('price_at_addition', 'total_price_display', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Thông tin sản phẩm', {
            'fields': ('cart', 'variant', 'quantity')
        }),
        ('Giá', {
            'fields': ('price_at_addition', 'total_price_display')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def cart_owner(self, obj):
        if obj.cart.user:
            return obj.cart.user.email
        return f"Khách {obj.cart.session_key[:8]}"
    cart_owner.short_description = "Giỏ hàng"
    
    def product_name(self, obj):
        return obj.variant.product.name
    product_name.short_description = "Sản phẩm"
    product_name.admin_order_field = 'variant__product__name'
    
    def variant_info(self, obj):
        return f"{obj.variant.color} - {obj.variant.size}"
    variant_info.short_description = "Biến thể"
    
    def total_price_display(self, obj):
        return f"{obj.get_total_price():,.0f} ₫"
    total_price_display.short_description = "Tổng tiền"
