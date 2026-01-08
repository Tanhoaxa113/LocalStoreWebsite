"""
ViewSets for Orders API only (Cart is in apps.carts)
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Order, OrderItem, ShippingAddress
from .serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderCreateSerializer
)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet cho Đơn hàng
    Người dùng có thể xem đơn hàng và tạo đơn mới
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Trả về đơn hàng của người dùng hiện tại"""
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        """Sử dụng serializer khác nhau cho list và detail"""
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderListSerializer
    
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """Tạo đơn hàng từ giỏ hàng hiện tại"""
        from apps.carts.models import Cart
        
        serializer = OrderCreateSerializer(data=request.data, context={'cart': None})
        
        # Lấy giỏ hàng
        cart = Cart.objects.filter(user=request.user).first()
        if not cart or cart.get_total_items() == 0:
            return Response({
                'error': 'Giỏ hàng trống.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate lại với cart
        serializer.context['cart'] = cart
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Tạo đơn hàng
        with transaction.atomic():
            # Tính tổng
            subtotal = cart.get_subtotal()
            shipping_cost = 30000  # TODO: Tính dựa trên địa chỉ
            total = subtotal + shipping_cost
            
            # Tạo đơn
            order = Order.objects.create(
                user=request.user,
                email=serializer.validated_data['email'],
                phone=serializer.validated_data['phone'],
                payment_method=serializer.validated_data['payment_method'],
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                total=total,
                customer_note=serializer.validated_data.get('customer_note', '')
            )
            
            # Tạo địa chỉ giao hàng
            ShippingAddress.objects.create(
                order=order,
                full_name=serializer.validated_data['shipping_full_name'],
                phone=serializer.validated_data['shipping_phone'],
                address_line1=serializer.validated_data['shipping_address_line1'],
                address_line2=serializer.validated_data.get('shipping_address_line2', ''),
                ward=serializer.validated_data.get('shipping_ward', ''),
                district=serializer.validated_data.get('shipping_district', ''),
                city=serializer.validated_data['shipping_city'],
                postal_code=serializer.validated_data.get('shipping_postal_code', ''),
                country=serializer.validated_data.get('shipping_country', 'Vietnam')
            )
            
            # Tạo order items từ cart
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    variant=cart_item.variant,
                    product_name=cart_item.variant.product.name,
                    variant_sku=cart_item.variant.sku,
                    variant_details={
                        'color': cart_item.variant.color,
                        'size': cart_item.variant.size,
                        'lens_type': cart_item.variant.lens_type,
                        'material': cart_item.variant.material
                    },
                    unit_price=cart_item.variant.get_display_price(),
                    quantity=cart_item.quantity,
                    total_price=cart_item.get_total_price()
                )
                
                # Giảm tồn kho
                cart_item.variant.stock -= cart_item.quantity
                cart_item.variant.save()
            
            # Xóa giỏ hàng
            cart.clear()
        
        # Trả về chi tiết đơn hàng
        order_serializer = OrderDetailSerializer(order)
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)
    
    def list(self, request, *args, **kwargs):
        """
        Override list để kiểm tra hết hạn các đơn hàng pending
        """
        # Lazy expiration check
        pending_orders = Order.objects.filter(user=request.user, status='pending')
        for order in pending_orders:
            order.check_expiration()
            
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Hủy đơn hàng"""
        order = self.get_object()
        
        if not order.can_cancel():
            return Response({
                'error': 'Không thể hủy đơn hàng ở trạng thái hiện tại.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use model method
        order.cancel_order(reason=f"Khách hàng {request.user.username} hủy đơn")
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
