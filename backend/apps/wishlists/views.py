"""
Wishlist ViewSet - API cho danh sách yêu thích
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Wishlist, WishlistItem
from .serializers import WishlistSerializer, WishlistItemSerializer
from apps.products.models import Product, ProductVariant


class WishlistViewSet(viewsets.ViewSet):
    """
    ViewSet cho Wishlist - Danh sách yêu thích
    """
    permission_classes = [IsAuthenticated]
    
    def _get_or_create_wishlist(self, user):
        """Lấy hoặc tạo wishlist cho user"""
        wishlist, created = Wishlist.objects.get_or_create(user=user)
        return wishlist
    
    def list(self, request):
        """Xem wishlist hiện tại"""
        wishlist = self._get_or_create_wishlist(request.user)
        serializer = WishlistSerializer(wishlist)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Thêm sản phẩm vào wishlist"""
        wishlist = self._get_or_create_wishlist(request.user)
        
        serializer = WishlistItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        product_id = serializer.validated_data['product_id']
        variant_id = serializer.validated_data.get('variant_id')
        
        # Kiểm tra xem sản phẩm đã có trong wishlist chưa
        existing_item = wishlist.items.filter(product_id=product_id).first()
        
        if existing_item:
            return Response({
                'message': 'Sản phẩm đã có trong danh sách yêu thích.'
            }, status=status.HTTP_200_OK)
        
        # Thêm sản phẩm mới
        product = Product.objects.get(pk=product_id)
        variant = ProductVariant.objects.get(pk=variant_id) if variant_id else None
        
        WishlistItem.objects.create(
            wishlist=wishlist,
            product=product,
            variant=variant
        )
        
        # Trả về wishlist đã cập nhật
        wishlist_serializer = WishlistSerializer(wishlist)
        return Response(wishlist_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        """Xóa sản phẩm khỏi wishlist"""
        wishlist = self._get_or_create_wishlist(request.user)
        item_id = request.data.get('item_id')
        product_id = request.data.get('product_id')
        
        if not item_id and not product_id:
            return Response({
                'error': 'Vui lòng cung cấp item_id hoặc product_id.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if item_id:
                item = wishlist.items.get(pk=item_id)
            else:
                item = wishlist.items.get(product_id=product_id)
            
            item.delete()
        except WishlistItem.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy sản phẩm trong danh sách yêu thích.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        wishlist_serializer = WishlistSerializer(wishlist)
        return Response(wishlist_serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Xóa tất cả sản phẩm trong wishlist"""
        wishlist = self._get_or_create_wishlist(request.user)
        wishlist.items.all().delete()
        
        wishlist_serializer = WishlistSerializer(wishlist)
        return Response(wishlist_serializer.data)
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Kiểm tra xem sản phẩm có trong wishlist không"""
        product_id = request.query_params.get('product_id')
        
        if not product_id:
            return Response({
                'error': 'Vui lòng cung cấp product_id.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        wishlist = self._get_or_create_wishlist(request.user)
        is_in_wishlist = wishlist.items.filter(product_id=product_id).exists()
        
        return Response({'is_in_wishlist': is_in_wishlist})
