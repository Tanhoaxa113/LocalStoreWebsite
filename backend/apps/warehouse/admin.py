from django.contrib import admin
from .models import InventoryLog, ImportNote, ImportNoteItem


@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ['variant', 'quantity_change', 'transaction_type', 'transaction_id', 
                    'stock_before', 'stock_after', 'created_by', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['variant__sku', 'transaction_id', 'note']
    readonly_fields = ['variant', 'quantity_change', 'transaction_type', 'transaction_id',
                       'note', 'stock_before', 'stock_after', 'created_by', 'created_at']
    
    def has_add_permission(self, request):
        # Prevent manual creation - logs should be created programmatically
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion for audit trail integrity
        return False


class ImportNoteItemInline(admin.TabularInline):
    model = ImportNoteItem
    extra = 1
    fields = ['variant', 'quantity', 'unit_cost', 'note']


@admin.register(ImportNote)
class ImportNoteAdmin(admin.ModelAdmin):
    list_display = ['import_number', 'status', 'total_items', 'total_quantity', 
                    'created_by', 'created_at', 'completed_at']
    list_filter = ['status', 'created_at']
    search_fields = ['import_number', 'notes']
    readonly_fields = ['import_number', 'total_items', 'total_quantity', 'completed_at']
    inlines = [ImportNoteItemInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
