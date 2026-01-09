"""
Warehouse & Inventory Management API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
import logging

from .models import InventoryLog, ImportNote
from .serializers import (
    InventoryLogSerializer, ImportNoteSerializer, ImportNoteCreateSerializer,
    LowStockVariantSerializer
)
from apps.products.models import ProductVariant

logger = logging.getLogger(__name__)


class IsStaffUser(IsAuthenticated):
    """Permission class for staff users only"""
    
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


class InventoryViewSet(viewsets.ViewSet):
    """
    ViewSet for inventory management operations
    
    Provides:
    - Low stock alerts
    - Inventory log history
    - Dashboard statistics
    """
    permission_classes = [IsStaffUser]
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get variants with low stock (stock <= threshold)
        
        GET /api/inventory/low-stock/
        Query params:
        - threshold: Override default threshold (default: 5)
        - out_of_stock_only: Show only out of stock items (stock = 0)
        """
        threshold = int(request.query_params.get('threshold', 5))
        out_of_stock_only = request.query_params.get('out_of_stock_only', 'false').lower() == 'true'
        
        if out_of_stock_only:
            queryset = ProductVariant.objects.filter(
                is_active=True,
                stock=0
            )
        else:
            queryset = ProductVariant.objects.filter(
                is_active=True,
                stock__lte=threshold
            )
        
        queryset = queryset.select_related('product').order_by('stock', 'product__name')
        
        serializer = LowStockVariantSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'threshold': threshold,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def logs(self, request):
        """
        Get inventory log history with filtering
        
        GET /api/inventory/logs/
        Query params:
        - variant_id: Filter by variant
        - transaction_type: Filter by type (IMPORT, ORDER, REFUND, ADJUSTMENT)
        - from_date: Start date (ISO format)
        - to_date: End date (ISO format)
        """
        queryset = InventoryLog.objects.select_related(
            'variant', 'variant__product', 'created_by'
        ).all()
        
        # Apply filters
        variant_id = request.query_params.get('variant_id')
        if variant_id:
            queryset = queryset.filter(variant_id=variant_id)
        
        transaction_type = request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        from_date = request.query_params.get('from_date')
        if from_date:
            queryset = queryset.filter(created_at__gte=from_date)
        
        to_date = request.query_params.get('to_date')
        if to_date:
            queryset = queryset.filter(created_at__lte=to_date)
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 50))
        page = int(request.query_params.get('page', 1))
        
        start = (page - 1) * page_size
        end = start + page_size
        
        total = queryset.count()
        results = queryset[start:end]
        
        serializer = InventoryLogSerializer(results, many=True)
        
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get inventory dashboard statistics
        
        GET /api/inventory/stats/
        """
        total_variants = ProductVariant.objects.filter(is_active=True).count()
        low_stock_count = ProductVariant.objects.filter(is_active=True, stock__lte=5, stock__gt=0).count()
        out_of_stock_count = ProductVariant.objects.filter(is_active=True, stock=0).count()
        
        recent_imports = ImportNote.objects.filter(status='COMPLETED').order_by('-completed_at')[:5]
        
        return Response({
            'total_variants': total_variants,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'recent_imports': ImportNoteSerializer(recent_imports, many=True).data
        })


class ImportNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing import notes
    
    Provides:
    - Create import notes
    - List import notes
    - Complete import notes (update stock)
    """
    permission_classes = [IsStaffUser]
    queryset = ImportNote.objects.prefetch_related('items__variant__product').all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ImportNoteCreateSerializer
        return ImportNoteSerializer
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Complete import note and update stock
        
        POST /api/inventory/import-notes/{id}/complete/
        """
        import_note = self.get_object()
        
        if import_note.status != 'DRAFT':
            return Response(
                {'error': f'Cannot complete import note with status {import_note.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = import_note.complete()
        
        if success:
            serializer = self.get_serializer(import_note)
            return Response({
                'message': 'Import note completed successfully',
                'import_note': serializer.data
            })
        else:
            return Response(
                {'error': 'Failed to complete import note'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a draft import note
        
        POST /api/inventory/import-notes/{id}/cancel/
        """
        import_note = self.get_object()
        
        if import_note.status != 'DRAFT':
            return Response(
                {'error': 'Only draft import notes can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        import_note.status = 'CANCELLED'
        import_note.save(update_fields=['status'])
        
        serializer = self.get_serializer(import_note)
        return Response({
            'message': 'Import note cancelled',
            'import_note': serializer.data
        })
