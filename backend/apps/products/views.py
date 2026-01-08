"""
ViewSets for Products API
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from .models import Category, Product, ProductVariant, ProductReview
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductVariantSerializer, ProductReviewSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Categories
    Provides list and retrieve endpoints
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Filter categories and optionally include children"""
        queryset = super().get_queryset()
        
        # Filter by parent (for navigation)
        parent_id = self.request.query_params.get('parent', None)
        if parent_id:
            if parent_id == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
        
        return queryset.order_by('display_order', 'name')


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Products
    Provides list, retrieve, and filtering
    """
    queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('variants', 'media')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'target_gender', 'is_featured', 'is_new_arrival', 'is_best_seller']
    search_fields = ['name', 'brand', 'description', 'short_description']
    ordering_fields = ['created_at', 'base_price', 'view_count', 'name']
    ordering = ['-created_at']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
    
    def get_queryset(self):
        """Custom filtering for products"""
        queryset = super().get_queryset()
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(variants__price__gte=min_price).distinct()
        if max_price:
            queryset = queryset.filter(variants__price__lte=max_price).distinct()
        
        # Filter by color
        color = self.request.query_params.get('color', None)
        if color:
            queryset = queryset.filter(variants__color__icontains=color).distinct()
        
        # Filter by lens type
        lens_type = self.request.query_params.get('lens_type', None)
        if lens_type:
            queryset = queryset.filter(variants__lens_type=lens_type).distinct()
        
        # Filter by material
        material = self.request.query_params.get('material', None)
        if material:
            queryset = queryset.filter(variants__material=material).distinct()
        
        # Filter by size
        size = self.request.query_params.get('size', None)
        if size:
            queryset = queryset.filter(variants__size=size).distinct()
        
        # Filter by availability
        in_stock = self.request.query_params.get('in_stock', None)
        if in_stock == 'true':
            queryset = queryset.filter(variants__stock__gt=0, variants__is_active=True).distinct()
        
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Increment view count when retrieving product detail"""
        instance = self.get_object()
        
        # Increment view count
        Product.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products"""
        queryset = self.get_queryset().filter(is_featured=True)[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def new_arrivals(self, request):
        """Get new arrival products"""
        queryset = self.get_queryset().filter(is_new_arrival=True).order_by('-created_at')[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def best_sellers(self, request):
        """Get best seller products"""
        queryset = self.get_queryset().filter(is_best_seller=True)[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def related(self, request, slug=None):
        """Get related products (same category)"""
        product = self.get_object()
        queryset = self.get_queryset().filter(
            category=product.category
        ).exclude(pk=product.pk)[:6]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProductVariantViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Product Variants
    Allows filtering variants by product
    """
    queryset = ProductVariant.objects.filter(is_active=True).select_related('product')
    serializer_class = ProductVariantSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'color', 'material', 'lens_type', 'size']
    
    def get_queryset(self):
        """Custom filtering"""
        queryset = super().get_queryset()
        
        # Filter by product slug
        product_slug = self.request.query_params.get('product_slug', None)
        if product_slug:
            queryset = queryset.filter(product__slug=product_slug)
        
        # Filter by availability
        in_stock = self.request.query_params.get('in_stock', None)
        if in_stock == 'true':
            queryset = queryset.filter(stock__gt=0)
        
        return queryset


class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product Reviews
    Users can create, read their own reviews
    Only approved reviews are visible to public
    """
    queryset = ProductReview.objects.filter(is_approved=True)
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Show all reviews for listing, or user's own unapproved reviews"""
        queryset = super().get_queryset()
        
        if self.request.user.is_authenticated:
            # Show approved reviews + user's own reviews
            queryset = ProductReview.objects.filter(
                Q(is_approved=True) | Q(user=self.request.user)
            )
        
        # Filter by product
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset.select_related('user', 'product')
    
    def perform_create(self, serializer):
        """Set user and check for existing review"""
        # Check if user already reviewed this product
        product = serializer.validated_data['product']
        if ProductReview.objects.filter(product=product, user=self.request.user).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You have already reviewed this product.")
        
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_reviews(self, request):
        """Get current user's reviews"""
        queryset = ProductReview.objects.filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get review statistics for a product"""
        product_id = pk
        
        stats = ProductReview.objects.filter(
            product_id=product_id,
            is_approved=True
        ).aggregate(
            average_rating=Avg('rating'),
            total_reviews=Count('id'),
            five_star=Count('id', filter=Q(rating=5)),
            four_star=Count('id', filter=Q(rating=4)),
            three_star=Count('id', filter=Q(rating=3)),
            two_star=Count('id', filter=Q(rating=2)),
            one_star=Count('id', filter=Q(rating=1)),
        )
        
        return Response(stats)
