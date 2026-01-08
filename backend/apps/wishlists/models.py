"""
Wishlist Models - Danh sách yêu thích
User's favorite products
"""

from django.db import models
from django.conf import settings


class Wishlist(models.Model):
    """
    Danh sách yêu thích của người dùng
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist',
        verbose_name='Người dùng'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wishlists'
        verbose_name = 'Danh sách yêu thích'
        verbose_name_plural = 'Danh sách yêu thích'

    def __str__(self):
        return f"Wishlist của {self.user.email}"

    def get_total_items(self):
        """Tổng số sản phẩm trong wishlist"""
        return self.items.count()


class WishlistItem(models.Model):
    """
    Sản phẩm trong danh sách yêu thích
    """
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Danh sách yêu thích'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name='Sản phẩm'
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Biến thể sản phẩm'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày thêm')

    class Meta:
        db_table = 'wishlist_items'
        ordering = ['-created_at']
        verbose_name = 'Sản phẩm yêu thích'
        verbose_name_plural = 'Sản phẩm yêu thích'
        unique_together = [['wishlist', 'product']]

    def __str__(self):
        return f"{self.product.name} trong wishlist của {self.wishlist.user.email}"
