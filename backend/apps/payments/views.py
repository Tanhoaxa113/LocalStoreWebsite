"""
Payment Views - VNPAY Integration
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

from .models import Payment
from apps.orders.models import Order
from .serializers import (
    VNPayPaymentRequestSerializer,
    VNPayResponseSerializer,
    PaymentSerializer
)
from .vnpay_utils import (
    generate_payment_url,
    validate_signature,
    parse_vnpay_response,
    get_response_message,
    is_payment_successful
)
from django.conf import settings

logger = logging.getLogger(__name__)


class VNPayPaymentCreateView(APIView):
    """
    Create VNPAY payment URL
    POST /api/payments/vnpay/create/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Generate VNPAY payment URL"""
        serializer = VNPayPaymentRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order_id = serializer.validated_data['order_id']
        payment_type = serializer.validated_data['payment_type']
        
        try:
            # Get order
            order = Order.objects.get(id=order_id)
            
            # Get client IP
            ip_address = self.get_client_ip(request)
            
            # Generate payment URL
            payment_url, transaction_id = generate_payment_url(
                order=order,
                payment_type=payment_type,
                ip_address=ip_address
            )
            
            # Create payment record
            payment = Payment.objects.create(
                order=order,
                payment_method=order.payment_method,
                amount=order.total,
                status='pending',
                transaction_id=transaction_id
            )
            
            logger.info(f"Created payment {payment.transaction_id} for order {order.order_number}")
            
            return Response({
                'success': True,
                'payment_url': payment_url,
                'transaction_id': transaction_id,
                'payment_id': str(payment.id)
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Đơn hàng không tồn tại.'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'Có lỗi xảy ra khi tạo thanh toán. Vui lòng thử lại.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip


@method_decorator(csrf_exempt, name='dispatch')
class VNPayReturnView(APIView):
    """
    Handle VNPAY return URL (user redirect after payment)
    GET /api/payments/vnpay/return/
    """
    permission_classes = []  # Public endpoint
    
    def get(self, request):
        """Process VNPAY return"""
        params = dict(request.GET)
        
        # Convert QueryDict to regular dict (unwrap lists)
        params = {k: v[0] if isinstance(v, list) else v for k, v in params.items()}
        
        logger.info(f"Received VNPAY return callback: {params.get('vnp_TxnRef', 'UNKNOWN')}")
        
        # Validate signature
        if not validate_signature(params, settings.VNPAY_HASH_SECRET):
            logger.warning(f"Invalid signature in return callback")
            return Response({
                'success': False,
                'message': 'Chữ ký không hợp lệ. Giao dịch có thể bị giả mạo.',
                'response_code': 'INVALID_SIGNATURE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse response
        parsed_data = parse_vnpay_response(params)
        response_code = parsed_data['response_code']
        transaction_id = parsed_data['transaction_id']
        
        try:
            # Get payment record
            payment = Payment.objects.get(transaction_id=transaction_id)
            
            with transaction.atomic():
                # Update payment based on response code
                if is_payment_successful(response_code):
                    payment.mark_success(
                        gateway_transaction_id=parsed_data['gateway_transaction_id'],
                        response_data=parsed_data['raw_params']
                    )
                    logger.info(f"Payment {transaction_id} marked as successful")
                else:
                    payment.mark_failed(
                        response_data=parsed_data['raw_params'],
                        note=get_response_message(response_code)
                    )
                    logger.warning(f"Payment {transaction_id} failed with code {response_code}")
            
            return Response({
                'success': is_payment_successful(response_code),
                'message': get_response_message(response_code),
                'transaction_id': transaction_id,
                'order_number': payment.order.order_number,
                'amount': float(parsed_data['amount']),
                'response_code': response_code
            }, status=status.HTTP_200_OK)
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for transaction {transaction_id}")
            return Response({
                'success': False,
                'message': 'Không tìm thấy giao dịch thanh toán.',
                'response_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error processing return: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': 'Có lỗi xảy ra khi xử lý kết quả thanh toán.',
                'response_code': 'ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class VNPayIPNView(APIView):
    """
    Handle VNPAY IPN (Instant Payment Notification)
    GET /api/payments/vnpay/ipn/
    """
    permission_classes = []  # Public endpoint (VNPAY server calls this)
    
    def get(self, request):
        """Process VNPAY IPN"""
        params = dict(request.GET)
        
        # Convert QueryDict to regular dict
        params = {k: v[0] if isinstance(v, list) else v for k, v in params.items()}
        
        logger.info(f"Received VNPAY IPN: {params.get('vnp_TxnRef', 'UNKNOWN')}")
        
        # Validate signature
        if not validate_signature(params, settings.VNPAY_HASH_SECRET):
            logger.warning("Invalid signature in IPN")
            return Response({
                'RspCode': '97',
                'Message': 'Invalid signature'
            })
        
        # Parse response
        parsed_data = parse_vnpay_response(params)
        response_code = parsed_data['response_code']
        transaction_id = parsed_data['transaction_id']
        
        try:
            # Get payment record
            payment = Payment.objects.get(transaction_id=transaction_id)
            
            # Prevent duplicate processing
            if payment.status in ['success', 'failed', 'cancelled']:
                logger.info(f"IPN for already processed payment {transaction_id}")
                return Response({
                    'RspCode': '00',
                    'Message': 'Order already confirmed'
                })
            
            with transaction.atomic():
                # Update payment
                if is_payment_successful(response_code):
                    payment.mark_success(
                        gateway_transaction_id=parsed_data['gateway_transaction_id'],
                        response_data=parsed_data['raw_params']
                    )
                    logger.info(f"IPN: Payment {transaction_id} marked as successful")
                else:
                    payment.mark_failed(
                        response_data=parsed_data['raw_params'],
                        note=get_response_message(response_code)
                    )
                    logger.warning(f"IPN: Payment {transaction_id} failed with code {response_code}")
            
            return Response({
                'RspCode': '00',
                'Message': 'Confirm Success'
            })
            
        except Payment.DoesNotExist:
            logger.error(f"IPN: Payment not found for transaction {transaction_id}")
            return Response({
                'RspCode': '01',
                'Message': 'Order not found'
            })
        except Exception as e:
            logger.error(f"IPN Error: {str(e)}", exc_info=True)
            return Response({
                'RspCode': '99',
                'Message': 'Unknown error'
            })


class PaymentListView(APIView):
    """
    List payments for authenticated user
    GET /api/payments/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """List user's payments"""
        payments = Payment.objects.filter(
            order__user=request.user
        ).order_by('-created_at')
        
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
