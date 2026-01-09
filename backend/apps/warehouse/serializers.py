"""
Serializers for Warehouse & Inventory Management
"""

from rest_framework import serializers
from .models import InventoryLog, ImportNote, ImportNoteItem
from apps.products.models import ProductVariant


class ProductVariantBasicSerializer(serializers.ModelSerializer):
    """Basic variant info for inventory displays"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'product_name', 'color', 'size', 'stock']
        read_only_fields = fields


class InventoryLogSerializer(serializers.ModelSerializer):
    """Serializer for inventory log history"""
    variant_info = ProductVariantBasicSerializer(source='variant', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    class Meta:
        model = InventoryLog
        fields = [
            'id', 'variant', 'variant_info', 'quantity_change', 
            'transaction_type', 'transaction_type_display', 'transaction_id',
            'note', 'stock_before', 'stock_after', 
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = fields


class ImportNoteItemSerializer(serializers.ModelSerializer):
    """Serializer for import note items (nested in ImportNote)"""
    variant_info = ProductVariantBasicSerializer(source='variant', read_only=True)
    
    class Meta:
        model = ImportNoteItem
        fields = ['id', 'variant', 'variant_info', 'quantity', 'unit_cost', 'note']
        read_only_fields = ['id']


class ImportNoteItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating import note items"""
    
    class Meta:
        model = ImportNoteItem
        fields = ['variant', 'quantity', 'unit_cost', 'note']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be positive")
        return value


class ImportNoteSerializer(serializers.ModelSerializer):
    """Serializer for import notes"""
    items = ImportNoteItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ImportNote
        fields = [
            'id', 'import_number', 'total_items', 'total_quantity',
            'notes', 'status', 'status_display', 
            'created_by', 'created_by_name', 'created_at', 'completed_at',
            'items'
        ]
        read_only_fields = ['id', 'import_number', 'total_items', 'total_quantity', 
                           'created_by', 'completed_at']


class ImportNoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating import notes with nested items"""
    items = ImportNoteItemCreateSerializer(many=True)
    
    class Meta:
        model = ImportNote
        fields = ['id', 'notes', 'items']
        read_only_fields = ['id']
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Import note must have at least one item")
        
        # Check for duplicate variants
        variant_ids = [item['variant'].id for item in value]
        if len(variant_ids) != len(set(variant_ids)):
            raise serializers.ValidationError("Duplicate variants not allowed in the same import note")
        
        return value
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Create import note
        import_note = ImportNote.objects.create(
            **validated_data,
            total_items=len(items_data)
        )
        
        # Create items
        for item_data in items_data:
            ImportNoteItem.objects.create(
                import_note=import_note,
                **item_data
            )
        
        return import_note


class LowStockVariantSerializer(serializers.ModelSerializer):
    """Serializer for low stock variants dashboard"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_brand = serializers.CharField(source='product.brand', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'product_name', 'product_brand',
            'color', 'size', 'stock', 'low_stock_threshold',
            'is_low_stock', 'is_out_of_stock', 'is_active'
        ]
        read_only_fields = fields
