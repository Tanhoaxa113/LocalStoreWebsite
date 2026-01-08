"""
Admin interface cho Wishlist - Danh sách yêu thích
"""

from django.contrib import admin
from .models import Wishlist, WishlistItem


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    readonly_fields = ('created_at',)
    fields = ('product', 'variant', 'created_at')


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'total_items', 'updated_at', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'updated_at')
    inlines = [WishlistItemInline]
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('user',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Email người dùng"
    user_email.admin_order_field = 'user__email'
    
    def total_items(self, obj):
        return obj.get_total_items()
    total_items.short_description = "Số sản phẩm"


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'product_name', 'variant_info', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('wishlist__user__email', 'product__name')
    readonly_fields = ('created_at',)
    
    def user_email(self, obj):
        return obj.wishlist.user.email
    user_email.short_description = "Người dùng"
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = "Sản phẩm"
    product_name.admin_order_field = 'product__name'
    
    def variant_info(self, obj):
        if obj.variant:
            return f"{obj.variant.color} - {obj.variant.size}"
        return "-"
    variant_info.short_description = "Biến thể"
