"""
Cart ViewSet với tính năng Auto-Merge im lặng (Silent Auto-Merge)
Tự động gộp giỏ hàng khách → giỏ hàng người dùng khi đăng nhập
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from apps.products.models import ProductVariant


class CartViewSet(viewsets.ViewSet):
    """
    ViewSet cho Giỏ hàng
    Hỗ trợ tự động gộp giỏ hàng (Silent Auto-Merge)
    """
    permission_classes = [AllowAny]
    
    def _get_or_create_cart(self, request):
        """
        Lấy hoặc tạo giỏ hàng
        Tự động gộp giỏ khách → giỏ user nếu đăng nhập
        """
        if request.user.is_authenticated:
            # User đã đăng nhập
            user_cart, created = Cart.objects.get_or_create(user=request.user)
            
            # SILENT AUTO-MERGE: Kiểm tra guest cart trong session
            session_key = request.session.session_key
            if session_key:
                guest_cart = Cart.objects.filter(session_key=session_key).first()
                
                if guest_cart and guest_cart.get_total_items() > 0:
                    # Tự động gộp giỏ khách vào giỏ user
                    self._silent_merge_carts(guest_cart, user_cart)
                    guest_cart.delete()  # Xóa giỏ khách sau khi gộp
            
            return user_cart
        else:
            # Khách (Guest user)
            session_key = request.session.session_key
            if not session_key:
                request.session.create()
                session_key = request.session.session_key
            
            cart, created = Cart.objects.get_or_create(session_key=session_key)
            return cart
    
    def _silent_merge_carts(self, guest_cart, user_cart):
        """
        Gộp giỏ khách vào giỏ user im lặng (không cần xác nhận)
        Handles conflicts: stock limits, duplicate items
        """
        import logging
        logger = logging.getLogger(__name__)
        
        with transaction.atomic():
            merge_conflicts = []
            
            for guest_item in guest_cart.items.all():
                try:
                    # Kiểm tra xem sản phẩm đã có trong giỏ user chưa
                    existing_item = user_cart.items.filter(variant=guest_item.variant).first()
                    
                    if existing_item:
                        # Tính tổng số lượng sau khi gộp
                        new_quantity = existing_item.quantity + guest_item.quantity
                        
                        # Kiểm tra stock availability
                        if guest_item.variant.stock < new_quantity:
                            # Nếu vượt quá stock, chỉ thêm số lượng tối đa có thể
                            available = guest_item.variant.stock - existing_item.quantity
                            if available > 0:
                                existing_item.quantity += available
                                existing_item.save()
                                merge_conflicts.append({
                                    'variant_id': guest_item.variant.id,
                                    'requested': guest_item.quantity,
                                    'added': available,
                                    'reason': 'insufficient_stock'
                                })
                            else:
                                merge_conflicts.append({
                                    'variant_id': guest_item.variant.id,
                                    'requested': guest_item.quantity,
                                    'added': 0,
                                    'reason': 'cart_already_at_max_stock'
                                })
                        else:
                            # Stock đủ, cộng dồn số lượng
                            existing_item.quantity = new_quantity
                            existing_item.save()
                    else:
                        # Sản phẩm chưa có trong giỏ user
                        # Kiểm tra stock trước khi thêm
                        if guest_item.variant.stock < guest_item.quantity:
                            # Chỉ thêm số lượng có sẵn
                            guest_item.quantity = guest_item.variant.stock
                            merge_conflicts.append({
                                'variant_id': guest_item.variant.id,
                                'requested': guest_item.quantity,
                                'added': guest_item.variant.stock,
                                'reason': 'insufficient_stock'
                            })
                        
                        # Chuyển item sang user cart
                        guest_item.cart = user_cart
                        guest_item.save()
                        
                except Exception as e:
                    logger.error(f"Error merging cart item {guest_item.id}: {str(e)}")
                    merge_conflicts.append({
                        'variant_id': guest_item.variant.id,
                        'error': str(e)
                    })
            
            # Log conflicts if any
            if merge_conflicts:
                logger.warning(f"Cart merge conflicts for user {user_cart.user.id}: {merge_conflicts}")
    
    def list(self, request):
        """Xem giỏ hàng hiện tại"""
        cart = self._get_or_create_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Thêm sản phẩm vào giỏ hàng"""
        cart = self._get_or_create_cart(request)
        
        serializer = CartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        variant_id = serializer.validated_data['variant_id']
        quantity = serializer.validated_data.get('quantity', 1)
        
        # Kiểm tra sản phẩm đã có trong giỏ chưa
        cart_item = cart.items.filter(variant_id=variant_id).first()
        
        if cart_item:
            # Cập nhật số lượng
            new_quantity = cart_item.quantity + quantity
            variant = cart_item.variant
            
            if variant.stock < new_quantity:
                return Response({
                    'error': f'Chỉ còn {variant.stock} sản phẩm trong kho.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item.quantity = new_quantity
            cart_item.save()
        else:
            # Thêm sản phẩm mới
            variant = ProductVariant.objects.get(pk=variant_id)
            cart_item = CartItem.objects.create(
                cart=cart,
                variant=variant,
                quantity=quantity,
                price_at_addition=variant.get_display_price()
            )
        
        # Trả về giỏ hàng đã cập nhật
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['patch'])
    def update_item(self, request):
        """Cập nhật số lượng sản phẩm"""
        cart = self._get_or_create_cart(request)
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity')
        
        if not item_id or quantity is None:
            return Response({
                'error': 'Vui lòng cung cấp item_id và quantity.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart_item = cart.items.get(pk=item_id)
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy sản phẩm trong giỏ hàng.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Kiểm tra số lượng
        if quantity < 1:
            return Response({
                'error': 'Số lượng phải lớn hơn 0.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if cart_item.variant.stock < quantity:
            return Response({
                'error': f'Chỉ còn {cart_item.variant.stock} sản phẩm trong kho.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_item.quantity = quantity
        cart_item.save()
        
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
    
    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        """Xóa sản phẩm khỏi giỏ hàng"""
        cart = self._get_or_create_cart(request)
        item_id = request.data.get('item_id')
        
        if not item_id:
            return Response({
                'error': 'Vui lòng cung cấp item_id.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart_item = cart.items.get(pk=item_id)
            cart_item.delete()
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy sản phẩm trong giỏ hàng.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Xóa tất cả sản phẩm trong giỏ hàng"""
        cart = self._get_or_create_cart(request)
        cart.clear()
        
        cart_serializer = CartSerializer(cart)
        return Response(cart_serializer.data)
