from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem, ShippingAddress, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    """Inline for order items"""
    model = OrderItem
    extra = 0
    fields = ('product_name', 'variant_sku', 'unit_price', 'quantity', 'total_price')
    readonly_fields = ('product_name', 'variant_sku', 'unit_price', 'quantity', 'total_price')
    can_delete = False


class ShippingAddressInline(admin.StackedInline):
    """Inline for shipping address"""
    model = ShippingAddress
    extra = 0
    fields = ('full_name', 'phone', 'address_line1', 'address_line2', 'ward', 'district', 'city', 'postal_code', 'country')
    readonly_fields = ('created_at',)


class OrderStatusHistoryInline(admin.TabularInline):
    """Inline for order status history"""
    model = OrderStatusHistory
    extra = 0
    fields = ('from_status', 'to_status', 'changed_by', 'note', 'created_at')
    readonly_fields = ('from_status', 'to_status', 'changed_by', 'created_at')
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin for Orders"""
    list_display = ('order_number', 'user', 'email', 'status_badge', 'payment_status_badge', 'total', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'user__email', 'email', 'phone', 'payment_transaction_id')
    readonly_fields = ('order_number', 'created_at', 'updated_at', 'confirmed_at', 'shipped_at', 'completed_at')
    
    fieldsets = (
        ('Order Info', {
            'fields': ('order_number', 'user', 'email', 'phone')
        }),
        ('Status', {
            'fields': ('status', 'payment_status', 'payment_method', 'payment_transaction_id')
        }),
        ('Pricing', {
            'fields': ('subtotal', 'shipping_cost', 'discount_amount', 'total')
        }),
        ('Notes', {
            'fields': ('customer_note', 'admin_note'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at', 'shipped_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [OrderItemInline, ShippingAddressInline, OrderStatusHistoryInline]
    
    def status_badge(self, obj):
        """Visual indicator for order status"""
        colors = {
            'pending': 'orange',
            'confirmed': 'blue',
            'processing': 'purple',
            'shipping': 'cyan',
            'completed': 'green',
            'cancelled': 'red',
            'refunded': 'gray',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def payment_status_badge(self, obj):
        """Visual indicator for payment status"""
        colors = {
            'pending': 'orange',
            'paid': 'green',
            'failed': 'red',
            'refunded': 'gray',
        }
        color = colors.get(obj.payment_status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_payment_status_display()
        )
    payment_status_badge.short_description = 'Payment'
    
    actions = ['mark_as_confirmed', 'mark_as_shipped', 'mark_as_completed']
    
    def mark_as_confirmed(self, request, queryset):
        from django.utils import timezone
        for order in queryset:
            if order.status == 'pending':
                order.status = 'confirmed'
                order.confirmed_at = timezone.now()
                order.save()
                OrderStatusHistory.objects.create(
                    order=order,
                    from_status='pending',
                    to_status='confirmed',
                    changed_by=request.user,
                    note='Status updated via admin action'
                )
        self.message_user(request, f"{queryset.count()} order(s) marked as confirmed.")
    mark_as_confirmed.short_description = "Mark selected orders as Confirmed"
    
    def mark_as_shipped(self, request, queryset):
        from django.utils import timezone
        for order in queryset.filter(status='confirmed'):
            order.status = 'shipping'
            order.shipped_at = timezone.now()
            order.save()
            OrderStatusHistory.objects.create(
                order=order,
                from_status='confirmed',
                to_status='shipping',
                changed_by=request.user,
                note='Status updated via admin action'
            )
        self.message_user(request, f"{queryset.count()} order(s) marked as shipped.")
    mark_as_shipped.short_description = "Mark selected orders as Shipping"
    
    def mark_as_completed(self, request, queryset):
        from django.utils import timezone
        for order in queryset.filter(status='shipping'):
            order.status = 'completed'
            order.completed_at = timezone.now()
            order.save()
            OrderStatusHistory.objects.create(
                order=order,
                from_status='shipping',
                to_status='completed',
                changed_by=request.user,
                note='Status updated via admin action'
            )
        self.message_user(request, f"{queryset.count()} order(s) marked as completed.")
    mark_as_completed.short_description = "Mark selected orders as Completed"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """Admin for Order Items"""
    list_display = ('order', 'product_name', 'variant_sku', 'quantity', 'unit_price', 'total_price')
    list_filter = ('created_at',)
    search_fields = ('order__order_number', 'product_name', 'variant_sku')
    readonly_fields = ('created_at',)


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    """Admin for Shipping Addresses"""
    list_display = ('order', 'full_name', 'phone', 'city', 'created_at')
    list_filter = ('city', 'created_at')
    search_fields = ('order__order_number', 'full_name', 'phone', 'address_line1')
    readonly_fields = ('created_at',)


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    """Admin for Order Status History"""
    list_display = ('order', 'from_status', 'to_status', 'changed_by', 'created_at')
    list_filter = ('from_status', 'to_status', 'created_at')
    search_fields = ('order__order_number', 'note')
    readonly_fields = ('created_at',)
