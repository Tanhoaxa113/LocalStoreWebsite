"""
Cart and CartItem Models - Separate App
Handles shopping cart for both guest and authenticated users
"""

from django.db import models
from django.conf import settings
import uuid


class Cart(models.Model):
    """
    Shopping Cart - supports both guest and authenticated users
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='carts',
        null=True,
        blank=True,
        db_index=True,
        help_text="Người dùng sở hữu giỏ hàng (null = khách)"
    )
    session_key = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        db_index=True,
        help_text="Session key cho khách (guest users)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'
        ordering = ['-updated_at']
        verbose_name = 'Giỏ hàng'
        verbose_name_plural = 'Giỏ hàng'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_key']),
        ]

    def __str__(self):
        if self.user:
            return f"Giỏ hàng của {self.user.email}"
        return f"Giỏ hàng khách {self.session_key[:8]}"

    def get_total_items(self):
        """Tổng số lượng sản phẩm trong giỏ"""
        return sum(item.quantity for item in self.items.all())

    def get_subtotal(self):
        """Tổng tiền giỏ hàng"""
        return sum(item.get_total_price() for item in self.items.all())

    def clear(self):
        """Xóa tất cả sản phẩm trong giỏ"""
        self.items.all().delete()


class CartItem(models.Model):
    """
    Item trong giỏ hàng
    """
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Giỏ hàng'
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        verbose_name='Biến thể sản phẩm'
    )
    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Số lượng'
    )
    price_at_addition = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Giá khi thêm vào giỏ',
        help_text='Lưu giá tại thời điểm thêm để tracking'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart_items'
        ordering = ['-created_at']
        verbose_name = 'Sản phẩm trong giỏ'
        verbose_name_plural = 'Sản phẩm trong giỏ'
        unique_together = [['cart', 'variant']]
        indexes = [
            models.Index(fields=['cart', 'variant']),
        ]

    def __str__(self):
        return f"{self.variant.product.name} ({self.variant.sku}) x{self.quantity}"

    def get_total_price(self):
        """Tổng tiền của item này"""
        # Sử dụng giá hiện tại của variant, không phải giá lúc thêm vào
        return self.variant.get_display_price() * self.quantity

    def save(self, *args, **kwargs):
        """Override save để tự động lưu giá khi thêm mới"""
        if not self.pk:  # New item
            self.price_at_addition = self.variant.get_display_price()
        super().save(*args, **kwargs)
