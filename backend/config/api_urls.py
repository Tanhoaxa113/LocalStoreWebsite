"""
URL Configuration for API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products.views import (
    CategoryViewSet, ProductViewSet,
    ProductVariantViewSet, ProductReviewViewSet
)
from apps.carts.views import CartViewSet
from apps.orders.views import OrderViewSet
from apps.users.views import UserProfileViewSet, UserAddressViewSet
from apps.wishlists.views import WishlistViewSet

# Create router
router = DefaultRouter()

# Register viewsets
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'variants', ProductVariantViewSet, basename='variant')
router.register(r'reviews', ProductReviewViewSet, basename='review')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'addresses', UserAddressViewSet, basename='address')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('apps.users.urls')),  # Authentication endpoints
    path('payments/', include('apps.payments.urls')),  # Payment endpoints
]

