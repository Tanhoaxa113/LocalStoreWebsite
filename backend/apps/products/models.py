import random
import string
from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Category(models.Model):
    """Product category with hierarchical support"""
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    # SEO fields
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'display_order']),
        ]
        
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


import random
import string

class Product(models.Model):
    """Main product model - represents a product line (e.g., 'Ray-Ban Aviator')"""
    
    # Basic Information
    name = models.CharField(max_length=300, db_index=True)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    sku_prefix = models.CharField(max_length=50, unique=True, help_text="Prefix for variant SKUs", blank=True)
    
    # Categorization
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products'
    )
    brand = models.CharField(max_length=100, db_index=True)
    
    # Description
    short_description = models.TextField(max_length=500, help_text="Brief product highlight")
    description = models.TextField(help_text="Full product description (supports HTML/Markdown)")
    
    # Product Attributes (shared across variants)
    target_gender = models.CharField(
        max_length=10,
        choices=[
            ('unisex', 'Unisex'),
            ('male', 'Male'),
            ('female', 'Female'),
            ('kids', 'Kids'),
        ],
        default='unisex'
    )
    
    # Pricing (base price range - actual prices on variants)
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Starting price for display"
    )
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False)
    is_new_arrival = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    
    # SEO Fields
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.CharField(max_length=300, blank=True)
    
    # Analytics
    view_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', '-created_at']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['brand', 'is_active']),
            models.Index(fields=['-view_count']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
            
        if not self.sku_prefix:
            # Generate SKU prefix: Brand(3) + Name(3) + Random(3)
            brand_code = slugify(self.brand)[:3].upper()
            name_code = slugify(self.name)[:3].upper()
            random_code = ''.join(random.choices(string.digits, k=3))
            self.sku_prefix = f"{brand_code}-{name_code}-{random_code}"
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    def get_price_range(self):
        """Get min and max price from active variants"""
        variants = self.variants.filter(is_active=True)
        if not variants.exists():
            return None
        
        prices = variants.values_list('price', flat=True)
        return {
            'min': min(prices),
            'max': max(prices)
        }
    
    def get_total_stock(self):
        """Get total stock across all active variants"""
        return self.variants.filter(is_active=True).aggregate(
            total=models.Sum('stock')
        )['total'] or 0
    
    def is_in_stock(self):
        """Check if any variant is in stock"""
        return self.variants.filter(is_active=True, stock__gt=0).exists()


class ProductVariant(models.Model):
    """
    Product variant with specific attributes (color, size, lens type, etc.)
    This is the actual sellable item with SKU and inventory
    """
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    
    # Unique Identifier
    sku = models.CharField(max_length=100, unique=True, db_index=True, blank=True)
    
    # Variant Attributes (specific to eyewear)
    color = models.CharField(max_length=50, help_text="Frame color (e.g., Black, Gold, Tortoise)")
    color_hex = models.CharField(max_length=7, blank=True, help_text="Hex color code for UI display")
    
    material = models.CharField(
        max_length=50,
        choices=[
            ('acetate', 'Acetate'),
            ('metal', 'Metal'),
            ('titanium', 'Titanium'),
            ('plastic', 'Plastic'),
            ('wood', 'Wood'),
            ('mixed', 'Mixed Materials'),
        ],
        default='acetate'
    )
    
    lens_type = models.CharField(
        max_length=50,
        choices=[
            ('clear', 'Clear (No Prescription)'),
            ('prescription', 'Prescription Ready'),
            ('polarized', 'Polarized'),
            ('photochromic', 'Photochromic (Transition)'),
            ('blue_light', 'Blue Light Filter'),
            ('sunglasses', 'Sunglasses'),
        ],
        default='clear'
    )
    
    size = models.CharField(
        max_length=20,
        choices=[
            ('XS', 'Extra Small'),
            ('S', 'Small'),
            ('M', 'Medium'),
            ('L', 'Large'),
            ('XL', 'Extra Large'),
        ],
        default='M',
        help_text="Frame size"
    )
    
    # Dimensions (in mm)
    lens_width = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    bridge_width = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    temple_length = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    
    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Discounted price (if on sale)"
    )
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Cost for profit calculation"
    )
    
    # Inventory
    stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    low_stock_threshold = models.IntegerField(default=5)
    
    # Weight (for shipping calculation)
    weight = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Weight in grams"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(
        default=False,
        help_text="Default variant to display for the product"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_default', 'color', 'size']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['product', 'is_active']),
            models.Index(fields=['stock']),
        ]
        # Ensure only one default variant per product
        constraints = [
            models.UniqueConstraint(
                fields=['product', 'is_default'],
                condition=models.Q(is_default=True),
                name='unique_default_variant_per_product'
            )
        ]
    
    def save(self, *args, **kwargs):
        if not self.sku and self.product:
            # Generate SKU: Prefix + Color + Size
            # Ensure product has sku_prefix, if not save it first
            if not self.product.sku_prefix:
                self.product.save()
                
            color_code = slugify(self.color)[:3].upper()
            self.sku = f"{self.product.sku_prefix}-{color_code}-{self.size}"
            
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.product.name} - {self.color} {self.size} ({self.sku})"
    
    def get_display_price(self):
        """Return sale price if available, otherwise regular price"""
        return self.sale_price if self.sale_price else self.price
    
    def is_on_sale(self):
        """Check if variant is currently on sale"""
        return self.sale_price is not None and self.sale_price < self.price
    
    def get_discount_percentage(self):
        """Calculate discount percentage"""
        if self.is_on_sale():
            discount = ((self.price - self.sale_price) / self.price) * 100
            return round(discount, 0)
        return 0
    
    def is_low_stock(self):
        """Check if stock is below threshold"""
        return 0 < self.stock <= self.low_stock_threshold
    
    def is_out_of_stock(self):
        """Check if completely out of stock"""
        return self.stock <= 0


class ProductMedia(models.Model):
    """
    Media files (images/videos) for products
    Supports Celery-based processing for automatic resizing/optimization
    """
    
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='media'
    )
    
    # Optional: Associate media with specific variant
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='media',
        null=True,
        blank=True,
        help_text="Leave blank for product-level media"
    )
    
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='image')
    
    # Original Upload
    original_file = models.FileField(
        upload_to='products/originals/%Y/%m/',
        help_text="Original uploaded file (unprocessed)"
    )
    
    # Processed Images (stored as JSON)
    # Example: {"thumbnail": "path/to/thumb.webp", "medium": "path/to/medium.webp", ...}
    processed_images = models.JSONField(
        default=dict,
        blank=True,
        help_text="URLs/paths to processed image sizes (WebP format)"
    )
    
    # Processed Video (for video type)
    processed_video = models.FileField(
        upload_to='products/videos/processed/%Y/%m/',
        null=True,
        blank=True,
        help_text="Processed video (HLS/MP4)"
    )
    video_thumbnail = models.ImageField(
        upload_to='products/videos/thumbnails/%Y/%m/',
        null=True,
        blank=True
    )
    
    # Metadata
    alt_text = models.CharField(max_length=200, blank=True, help_text="Alt text for SEO")
    title = models.CharField(max_length=200, blank=True)
    display_order = models.IntegerField(default=0)
    
    # Processing Status
    is_processed = models.BooleanField(default=False)
    processing_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    processing_error = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'created_at']
        verbose_name_plural = 'Product Media'
        indexes = [
            models.Index(fields=['product', 'display_order']),
            models.Index(fields=['variant', 'display_order']),
        ]
    
    def __str__(self):
        return f"{self.get_media_type_display()} for {self.product.name}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Trigger Celery task for processing (only on new uploads)
        if is_new and not self.is_processed:
            from apps.products.tasks import process_product_media
            process_product_media.delay(self.pk)


class ProductReview(models.Model):
    """Customer reviews for products"""
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    user = models.ForeignKey(
        'users.User',  # Assuming custom user model
        on_delete=models.CASCADE,
        related_name='product_reviews'
    )
    
    # Review Content
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    title = models.CharField(max_length=200)
    comment = models.TextField()
    
    # Verification
    is_verified_purchase = models.BooleanField(default=False)
    
    # Status
    is_approved = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        # One review per user per product
        unique_together = ['product', 'user']
        indexes = [
            models.Index(fields=['product', 'is_approved']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email}'s review of {self.product.name} ({self.rating}★)"
