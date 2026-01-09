"""
URL Configuration for Warehouse & Inventory API
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryViewSet, ImportNoteViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'import-notes', ImportNoteViewSet, basename='import-notes')

urlpatterns = router.urls
