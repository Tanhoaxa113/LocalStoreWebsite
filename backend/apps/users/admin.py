from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserAddress


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin for Custom User Model"""
    
    # Fields to display in the list view
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_email_verified', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'is_email_verified', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)
    
    # Fieldsets for the edit form
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'avatar')
        }),
        ('Address', {
            'fields': ('address_line1', 'address_line2', 'ward', 'district', 'city', 'postal_code', 'country'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Email Verification', {
            'fields': ('is_email_verified', 'email_verification_token'),
            'classes': ('collapse',)
        }),
        ('Preferences', {
            'fields': ('receive_newsletter', 'receive_order_updates'),
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    # Fieldsets for the add form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    """Admin for User Saved Addresses"""
    list_display = ('user', 'label', 'recipient_name', 'city', 'is_default', 'created_at')
    list_filter = ('is_default', 'city', 'created_at')
    search_fields = ('user__email', 'user__username', 'label', 'recipient_name', 'address_line1')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {
            'fields': ('user', 'label', 'is_default')
        }),
        ('Recipient', {
            'fields': ('recipient_name', 'recipient_phone')
        }),
        ('Address', {
            'fields': ('address_line1', 'address_line2', 'ward', 'district', 'city', 'postal_code', 'country')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
