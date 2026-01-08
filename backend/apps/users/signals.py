"""
User app signals - Auto-create Cart and Wishlist on registration
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_resources(sender, instance, created, **kwargs):
    """
    Signal to automatically create Cart and Wishlist when a new user registers
    """
    if created:
        # Import here to avoid circular imports
        from apps.carts.models import Cart
        from apps.wishlists.models import Wishlist
        
        # Create empty cart for the new user
        Cart.objects.get_or_create(user=instance)
        
        # Create empty wishlist for the new user
        Wishlist.objects.get_or_create(user=instance)
