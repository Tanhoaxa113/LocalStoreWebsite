"""
Order Management API Views
REST API endpoints for Sales Manager and Warehouse dashboards
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Q, Count, Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.orders.models import Order, OrderStatus, Voucher
from apps.orders.serializers import (
    OrderListSerializer, OrderDetailSerializer, OrderStatsSerializer,
    ConfirmOrderSerializer, ShipOrderSerializer, DeliverOrderSerializer,
    CancelOrderSerializer, ApproveRefundSerializer, RejectRefundSerializer,
    RequestRefundSerializer, VoucherSerializer
)
from apps.orders.services import OrderService


class IsStaffUser(IsAdminUser):
    """Permission class for staff users"""
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Order management
    
    Provides:
    - List orders with filtering
    - Retrieve order details
    - Action endpoints for status transitions
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Get filtered queryset based on query parameters
        - Staff: Can see all orders
        - Customer: Can only see their own orders
        """
        user = self.request.user
        queryset = Order.objects.select_related(
            'user', 'shipping_address'
        ).prefetch_related(
            'items', 'status_history', 'applied_vouchers'
        ).order_by('-created_at')
        
        # Access control
        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by payment status
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        
        # Search by order number or customer email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_order(self, request):
        """
        Create new order from cart (customer-facing endpoint)
        
        POST /api/orders/create_order/
        """
        from apps.carts.models import Cart
        
        # Get user's cart
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({
                'error': 'Giỏ hàng trống'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not cart.items.exists():
            return Response({
                'error': 'Giỏ hàng trống'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract shipping address data
        shipping_data = {
            'full_name': request.data.get('shipping_full_name'),
            'phone': request.data.get('shipping_phone'),
            'address_line1': request.data.get('shipping_address_line1'),
            'address_line2': request.data.get('shipping_address_line2', ''),
            'ward': request.data.get('shipping_ward', ''),
            'district': request.data.get('shipping_district', ''),
            'city': request.data.get('shipping_city'),
            'postal_code': request.data.get('shipping_postal_code', ''),
            'country': request.data.get('shipping_country', 'Vietnam'),
        }
        
        payment_method = request.data.get('payment_method', 'cod')
        voucher_codes = request.data.get('voucher_codes', [])
        
        try:
            # Create order using OrderService
            order = OrderService.create_order(
                user=request.user,
                cart_items=cart.items.all(),
                shipping_address_data=shipping_data,
                payment_method=payment_method,
                voucher_codes=voucher_codes
            )
            
            # Add customer note if provided
            if request.data.get('customer_note'):
                order.customer_note = request.data.get('customer_note')
                order.save(update_fields=['customer_note'])
            
            # Clear cart after successful order creation
            cart.items.all().delete()
            
            # Check if VNPAY payment is needed
            if payment_method in ['vnpay_qr', 'vnpay_card']:
                from apps.payments.vnpay_utils import generate_payment_url
                from apps.payments.models import Payment
                
                # Get client IP
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip_address = x_forwarded_for.split(',')[0]
                else:
                    ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
                
                # Generate payment URL
                payment_type = 'qr' if payment_method == 'vnpay_qr' else 'card'
                try:
                    payment_url, transaction_id = generate_payment_url(
                        order=order,
                        payment_type=payment_type,
                        ip_address=ip_address
                    )
                    
                    # Create payment record
                    Payment.objects.create(
                        order=order,
                        payment_method=payment_method,
                        amount=order.total,
                        status='pending',
                        transaction_id=transaction_id
                    )
                    
                    return Response({
                        'success': True,
                        'requires_payment': True,
                        'payment_url': payment_url,
                        'transaction_id': transaction_id,
                        'order': OrderDetailSerializer(order).data
                    }, status=status.HTTP_201_CREATED)
                
                except Exception as payment_error:
                    import traceback
                    traceback.print_exc()
                    return Response({
                        'error': 'Có lỗi khi tạo thanh toán. Vui lòng thử lại.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # COD or other payment methods - no redirect needed
            return Response({
                'success': True,
                'requires_payment': False,
                'message': 'Đơn hàng đã được tạo thành công',
                'order': OrderDetailSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': 'Có lỗi xảy ra khi tạo đơn hàng'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get dashboard statistics
        
        GET /api/orders/stats/
        """
        # Today's stats
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = Order.objects.filter(created_at__gte=today_start)
        
        today_stats = today_orders.aggregate(
            count=Count('id'),
            total=Sum('total')
        )
        
        # Pending actions
        pending_confirmation = Order.objects.filter(status=OrderStatus.CONFIRMING).count()
        pending_refund = Order.objects.filter(status=OrderStatus.REFUND_REQUESTED).count()
        ready_to_ship = Order.objects.filter(status=OrderStatus.CONFIRMED).count()
        
        # Overall stats
        all_orders = Order.objects.aggregate(
            count=Count('id'),
            total=Sum('total')
        )
        
        # Status breakdown
        status_breakdown = {}
        for status_choice in OrderStatus.choices:
            status_code = status_choice[0]
            status_label = status_choice[1]
            count = Order.objects.filter(status=status_code).count()
            status_breakdown[status_code] = {
                'label': status_label,
                'count': count
            }
        
        data = {
            'total_orders_today': today_stats['count'] or 0,
            'revenue_today': today_stats['total'] or Decimal('0.00'),
            'pending_confirmation_count': pending_confirmation,
            'pending_refund_count': pending_refund,
            'ready_to_ship_count': ready_to_ship,
            'total_orders': all_orders['count'] or 0,
            'total_revenue': all_orders['total'] or Decimal('0.00'),
            'status_breakdown': status_breakdown
        }
        
        serializer = OrderStatsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm order (CONFIRMING -> CONFIRMED)
        
        POST /api/orders/{id}/confirm/
        Body: {"note": "Optional note"}
        """
        order = self.get_object()
        serializer = ConfirmOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            success = OrderService.confirm_order(
                order=order,
                staff_user=request.user
            )
            
            if success:
                return Response({
                    'message': f'Đơn hàng {order.order_number} đã được xác nhận',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể xác nhận đơn hàng này'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """
        Mark order as delivering (CONFIRMED -> DELIVERING)
        
        POST /api/orders/{id}/ship/
        Body: {"tracking_number": "...", "carrier": "...", "note": "..."}
        """
        order = self.get_object()
        serializer = ShipOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            success = OrderService.mark_as_delivering(
                order=order,
                staff_user=request.user,
                tracking_number=serializer.validated_data['tracking_number'],
                carrier=serializer.validated_data['carrier']
            )
            
            if success:
                return Response({
                    'message': f'Đơn hàng {order.order_number} đã được chuyển sang trạng thái giao hàng',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể chuyển đơn hàng sang trạng thái giao hàng'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        """
        Mark order as delivered (DELIVERING -> DELIVERED)
        
        POST /api/orders/{id}/deliver/
        Body: {"note": "Optional note"}
        """
        order = self.get_object()
        serializer = DeliverOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            success = OrderService.mark_as_delivered(
                order=order,
                staff_user=request.user
            )
            
            if success:
                return Response({
                    'message': f'Đơn hàng {order.order_number} đã được giao thành công',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể chuyển đơn hàng sang trạng thái đã giao'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel order
        
        POST /api/orders/{id}/cancel/
        Body: {"reason": "Cancellation reason"}
        """
        order = self.get_object()
        serializer = CancelOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            success = OrderService.cancel_order(
                order=order,
                actor=request.user,
                reason=serializer.validated_data['reason']
            )
            
            if success:
                return Response({
                    'message': f'Đơn hàng {order.order_number} đã được hủy',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể hủy đơn hàng này'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def approve_refund(self, request, pk=None):
        """
        Approve refund request
        
        POST /api/orders/{id}/approve_refund/
        Body: {"note": "Optional note"}
        """
        order = self.get_object()
        serializer = ApproveRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            success = OrderService.approve_refund(
                order=order,
                staff_user=request.user
            )
            
            if success:
                return Response({
                    'message': f'Yêu cầu hoàn tiền cho đơn hàng {order.order_number} đã được phê duyệt',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể phê duyệt hoàn tiền'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reject_refund(self, request, pk=None):
        """
        Reject refund request
        
        POST /api/orders/{id}/reject_refund/
        Body: {"reason": "Rejection reason"}
        """
        order = self.get_object()
        serializer = RejectRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            success = OrderService.reject_refund(
                order=order,
                staff_user=request.user,
                rejection_reason=serializer.validated_data['reason']
            )
            
            if success:
                return Response({
                    'message': f'Yêu cầu hoàn tiền cho đơn hàng {order.order_number} đã bị từ chối',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể từ chối hoàn tiền'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def request_refund(self, request, pk=None):
        """
        Customer requests refund
        
        POST /api/orders/{id}/request_refund/
        Body: {"reason": "Refund reason"}
        """
        order = self.get_object()
        
        # Verify order belongs to user (or allow staff)
        if not request.user.is_staff and order.user != request.user:
            return Response({
                'error': 'Bạn không có quyền thực hiện hành động này'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = RequestRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            success = OrderService.request_refund(
                order=order,
                user=request.user,
                reason=serializer.validated_data['reason']
            )
            
            if success:
                return Response({
                    'message': f'Yêu cầu hoàn tiền cho đơn hàng {order.order_number} đã được gửi',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể yêu cầu hoàn tiền'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel_refund(self, request, pk=None):
        """
        Customer cancels refund request
        
        POST /api/orders/{id}/cancel_refund/
        """
        order = self.get_object()
        
        # Verify order belongs to user
        if not request.user.is_staff and order.user != request.user:
            return Response({
                'error': 'Bạn không có quyền thực hiện hành động này'
            }, status=status.HTTP_403_FORBIDDEN)
            
        try:
            success = OrderService.cancel_refund_request(
                order=order,
                user=request.user
            )
            
            if success:
                return Response({
                    'message': 'Đã hủy yêu cầu hoàn tiền',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể hủy yêu cầu hoàn tiền'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """
        Customer completes order
        
        POST /api/orders/{id}/complete/
        """
        order = self.get_object()
        
        # Verify order belongs to user
        if not request.user.is_staff and order.user != request.user:
            return Response({
                'error': 'Bạn không có quyền thực hiện hành động này'
            }, status=status.HTTP_403_FORBIDDEN)
            
        try:
            success = OrderService.complete_order(
                order=order,
                user=request.user
            )
            
            if success:
                return Response({
                    'message': 'Đơn hàng đã được hoàn tất',
                    'order': OrderDetailSerializer(order).data
                })
            else:
                return Response({
                    'error': 'Không thể hoàn tất đơn hàng'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def retry_payment(self, request, pk=None):
        """
        Retry payment for failed orders within 15-minute window
        
        POST /api/orders/{id}/retry_payment/
        """
        order = self.get_object()
        
        # Verify order belongs to user (or allow staff)
        if not request.user.is_staff and order.user != request.user:
            return Response({
                'error': 'Bạn không có quyền thực hiện hành động này'
            }, status=status.HTTP_403_FORBIDDEN)
            
        # Check eligibility
        allowed_retry_statuses = [
            OrderStatus.PENDING,
            OrderStatus.PROCESSING_SUCCESS,
            OrderStatus.CONFIRMING
        ]
        
        if order.status not in allowed_retry_statuses:
            return Response({
                'error': 'Đơn hàng không ở trạng thái chờ xử lý'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if order.payment_method not in ['vnpay_qr', 'vnpay_card']:
            return Response({
                'error': 'Phương thức thanh toán không hỗ trợ thử lại'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Check time window (15 minutes) - Allow a small grace period for network latency
        if order.created_at + timedelta(minutes=16) < timezone.now():
            return Response({
                'error': 'Đã quá thời gian thanh toán (15 phút)'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from apps.payments.vnpay_utils import generate_payment_url
            from apps.payments.models import Payment
            
            # Get client IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0]
            else:
                ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
            
            # Generate payment URL
            payment_type = 'qr' if order.payment_method == 'vnpay_qr' else 'card'
            
            payment_url, transaction_id = generate_payment_url(
                order=order,
                payment_type=payment_type,
                ip_address=ip_address
            )
            
            # Create new payment record
            Payment.objects.create(
                order=order,
                payment_method=order.payment_method,
                amount=order.total,
                status='pending',
                transaction_id=transaction_id
            )
            
            return Response({
                'success': True,
                'payment_url': payment_url,
                'transaction_id': transaction_id
            })
            
        except Exception as e:
            return Response({
                'error': 'Có lỗi khi tạo thanh toán: ' + str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VoucherViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Voucher management (staff only)
    
    Provides:
    - List active vouchers
    - Retrieve voucher details
    - Validate voucher code
    """
    
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = VoucherSerializer
    queryset = Voucher.objects.all().order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get all active and valid vouchers
        
        GET /api/vouchers/active/
        """
        vouchers = Voucher.objects.filter(
            is_active=True,
            valid_from__lte=timezone.now(),
            valid_until__gte=timezone.now()
        )
        
        serializer = self.get_serializer(vouchers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """
        Validate voucher code for a given order total
        
        POST /api/vouchers/validate/
        Body: {"code": "...", "order_total": "100.00"}
        """
        code = request.data.get('code', '').upper()
        order_total = Decimal(request.data.get('order_total', '0'))
        
        try:
            voucher = Voucher.objects.get(code=code)
            can_use, error_message = voucher.can_use(request.user, order_total)
            
            if can_use:
                return Response({
                    'valid': True,
                    'voucher': self.get_serializer(voucher).data,
                    'message': 'Mã voucher hợp lệ'
                })
            else:
                return Response({
                    'valid': False,
                    'error': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Voucher.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Mã voucher không tồn tại'
            }, status=status.HTTP_404_NOT_FOUND)
