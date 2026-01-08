from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    Adds additional fields for e-commerce functionality
    """
    
    # Override email to make it required and unique
    email = models.EmailField(unique=True, db_index=True)
    
    # Additional profile fields
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )
    
    date_of_birth = models.DateField(null=True, blank=True)
    
    avatar = models.ImageField(
        upload_to='users/avatars/%Y/%m/',
        null=True,
        blank=True
    )
    
    # Address fields (default shipping address)
    address_line1 = models.CharField(max_length=300, blank=True)
    address_line2 = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    ward = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='Vietnam')
    
    # Email verification
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True)
    
    # Preferences
    receive_newsletter = models.BooleanField(default=True)
    receive_order_updates = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
        ]
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return full name or email if name not available"""
        full_name = super().get_full_name()
        return full_name if full_name else self.email
    
    def get_default_address(self):
        """Get formatted default address"""
        if not self.address_line1:
            return None
        
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        if self.ward:
            parts.append(self.ward)
        if self.district:
            parts.append(self.district)
        parts.append(self.city)
        if self.postal_code:
            parts.append(self.postal_code)
        parts.append(self.country)
        return ', '.join(parts)


class UserAddress(models.Model):
    """
    Additional addresses for a user
    Users can have multiple saved addresses
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='addresses'
    )
    
    label = models.CharField(
        max_length=50,
        help_text="E.g., 'Home', 'Office', 'Parent's House'"
    )
    
    # Recipient (may be different from user)
    recipient_name = models.CharField(max_length=200)
    recipient_phone = models.CharField(max_length=20)
    
    # Address
    address_line1 = models.CharField(max_length=300)
    address_line2 = models.CharField(max_length=300, blank=True)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100, blank=True)
    ward = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='Vietnam')
    
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'User Addresses'
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.label}"
    
    def get_full_address(self):
        """Get formatted full address"""
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        if self.ward:
            parts.append(self.ward)
        if self.district:
            parts.append(self.district)
        parts.append(self.city)
        if self.postal_code:
            parts.append(self.postal_code)
        parts.append(self.country)
        return ', '.join(parts)
