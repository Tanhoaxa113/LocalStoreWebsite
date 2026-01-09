"""
Warehouse & Inventory Models
Handles inventory tracking, import notes, and stock movement history
"""

from django.db import models, transaction
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
import uuid
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class InventoryLog(models.Model):
    """
    Comprehensive log of all inventory movements
    Tracks imports, order deductions, and refunds for audit trail
    """
    
    TRANSACTION_TYPE_CHOICES = [
        ('IMPORT', 'Import Stock'),
        ('ORDER', 'Order Deduction'),
        ('REFUND', 'Order Refund/Cancel'),
        ('ADJUSTMENT', 'Manual Adjustment'),
    ]
    
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        related_name='inventory_logs',
        verbose_name='Product Variant'
    )
    
    quantity_change = models.IntegerField(
        help_text='Positive for additions (import, refund), negative for deductions (order)'
    )
    
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        db_index=True
    )
    
    # Reference to source transaction (Order number, Import Note number, etc.)
    transaction_id = models.CharField(
        max_length=100,
        db_index=True,
        help_text='Order number, import note number, or adjustment ID'
    )
    
    note = models.TextField(blank=True, help_text='Additional notes about this transaction')
    
    # Stock levels before and after transaction (for audit)
    stock_before = models.IntegerField()
    stock_after = models.IntegerField()
    
    # Who performed this action
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_logs',
        help_text='User who performed this action (null for system actions)'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'inventory_logs'
        ordering = ['-created_at']
        verbose_name = 'Inventory Log'
        verbose_name_plural = 'Inventory Logs'
        indexes = [
            models.Index(fields=['variant', '-created_at']),
            models.Index(fields=['transaction_type', '-created_at']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        sign = '+' if self.quantity_change > 0 else ''
        return f"{self.variant.sku}: {sign}{self.quantity_change} ({self.get_transaction_type_display()})"
    
    @classmethod
    def log_transaction(cls, variant, quantity_change, transaction_type, transaction_id, 
                       stock_before, stock_after, created_by=None, note=''):
        """
        Helper method to create an inventory log entry
        
        Args:
            variant: ProductVariant instance
            quantity_change: Integer (positive or negative)
            transaction_type: One of TRANSACTION_TYPE_CHOICES
            transaction_id: Reference ID (order number, import note number, etc.)
            stock_before: Stock level before transaction
            stock_after: Stock level after transaction
            created_by: User instance (optional)
            note: Additional notes (optional)
        
        Returns:
            InventoryLog instance
        """
        log = cls.objects.create(
            variant=variant,
            quantity_change=quantity_change,
            transaction_type=transaction_type,
            transaction_id=transaction_id,
            note=note,
            stock_before=stock_before,
            stock_after=stock_after,
            created_by=created_by
        )
        
        logger.info(
            f"Inventory log created: {variant.sku} {quantity_change:+d} "
            f"({transaction_type}) - {stock_before} → {stock_after}"
        )
        
        return log


class ImportNote(models.Model):
    """
    Represents a bulk stock import operation
    Similar to a purchase order or goods receipt
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    import_number = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text='Unique import note number (e.g., IMP-2024-001)'
    )
    
    total_items = models.IntegerField(
        default=0,
        help_text='Total number of different variants in this import'
    )
    
    total_quantity = models.IntegerField(
        default=0,
        help_text='Total quantity of all items imported'
    )
    
    notes = models.TextField(
        blank=True,
        help_text='General notes about this import (supplier, reason, etc.)'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        db_index=True
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='import_notes',
        verbose_name='Created By'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'import_notes'
        ordering = ['-created_at']
        verbose_name = 'Import Note'
        verbose_name_plural = 'Import Notes'
        indexes = [
            models.Index(fields=['import_number']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.import_number} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        """Generate import number if not provided"""
        if not self.import_number:
            from django.utils import timezone
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            self.import_number = f"IMP-{timestamp}"
        super().save(*args, **kwargs)
    
    def complete(self):
        """
        Complete the import note - atomically update stock and create logs
        
        CRITICAL: Uses transaction.atomic() and select_for_update() for race condition safety
        
        Returns:
            bool: True if successful, False otherwise
        """
        from apps.products.models import ProductVariant
        from django.utils import timezone
        
        if self.status != 'DRAFT':
            logger.warning(f"Cannot complete import note {self.import_number} - status is {self.status}")
            return False
        
        try:
            with transaction.atomic():
                # Lock this import note to prevent concurrent completions
                import_note = ImportNote.objects.select_for_update().get(pk=self.pk)
                
                if import_note.status != 'DRAFT':
                    return False
                
                # Process each item in the import note
                total_qty = 0
                for item in self.items.select_related('variant'):
                    # Lock the variant row to prevent concurrent stock modifications
                    variant = ProductVariant.objects.select_for_update().get(id=item.variant.id)
                    
                    # Record stock before change
                    stock_before = variant.stock
                    
                    # Add stock
                    variant.stock += item.quantity
                    variant.save(update_fields=['stock', 'updated_at'])
                    
                    # Create inventory log
                    InventoryLog.log_transaction(
                        variant=variant,
                        quantity_change=item.quantity,
                        transaction_type='IMPORT',
                        transaction_id=self.import_number,
                        stock_before=stock_before,
                        stock_after=variant.stock,
                        created_by=self.created_by,
                        note=f"Import note: {self.notes}" if self.notes else ''
                    )
                    
                    total_qty += item.quantity
                    
                    logger.info(
                        f"Imported {item.quantity} units of {variant.sku}. "
                        f"Stock: {stock_before} → {variant.stock}"
                    )
                
                # Update import note status
                import_note.status = 'COMPLETED'
                import_note.completed_at = timezone.now()
                import_note.total_quantity = total_qty
                import_note.save(update_fields=['status', 'completed_at', 'total_quantity'])
                
                logger.info(f"Import note {self.import_number} completed successfully. Total: {total_qty} units")
                return True
                
        except Exception as e:
            logger.error(f"Error completing import note {self.import_number}: {str(e)}")
            return False


class ImportNoteItem(models.Model):
    """
    Individual line item in an import note
    Represents quantity imported for a specific product variant
    """
    
    import_note = models.ForeignKey(
        ImportNote,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Import Note'
    )
    
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.PROTECT,
        related_name='import_items',
        verbose_name='Product Variant'
    )
    
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Quantity to import'
    )
    
    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Cost per unit (optional, for accounting purposes)'
    )
    
    note = models.TextField(
        blank=True,
        help_text='Notes specific to this item'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'import_note_items'
        ordering = ['created_at']
        verbose_name = 'Import Note Item'
        verbose_name_plural = 'Import Note Items'
        # Prevent duplicate variants in the same import note
        unique_together = ['import_note', 'variant']
    
    def __str__(self):
        return f"{self.variant.sku} x{self.quantity}"
