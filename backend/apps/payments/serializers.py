"""
Serializers for Payment API
"""

from rest_framework import serializers
from .models import Payment
from apps.orders.models import Order


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number', 'payment_method', 'payment_method_display',
            'amount', 'status', 'status_display', 'transaction_id',
            'gateway_transaction_id', 'response_data', 'note',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'gateway_transaction_id',
            'response_data', 'created_at', 'updated_at', 'completed_at'
        ]


class VNPayPaymentRequestSerializer(serializers.Serializer):
    """Serializer for VNPAY payment initiation request"""
    
    order_id = serializers.UUIDField(required=True)
    payment_type = serializers.ChoiceField(
        choices=[('qr', 'QR Code'), ('card', 'Bank Card')],
        required=True
    )
    
    def validate_order_id(self, value):
        """Validate that order exists"""
        try:
            order = Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Đơn hàng không tồn tại.")
        return value
    
    def validate(self, data):
        """Additional validation"""
        # Get order
        try:
            order = Order.objects.get(id=data['order_id'])
        except Order.DoesNotExist:
            raise serializers.ValidationError({"order_id": "Đơn hàng không tồn tại."})
        
        # Check if order belongs to requesting user (will be set in view)
        request = self.context.get('request')
        if request and order.user != request.user:
            raise serializers.ValidationError({"order_id": "Bạn không có quyền thanh toán đơn hàng này."})
        
        # Check order status
        if order.payment_status == 'paid':
            raise serializers.ValidationError({"order_id": "Đơn hàng này đã được thanh toán."})
        
        # Check payment method is VNPAY
        if order.payment_method not in ['vnpay_qr', 'vnpay_card']:
            raise serializers.ValidationError({
                "order_id": "Đơn hàng này không sử dụng phương thức thanh toán VNPAY."
            })
        
        return data


class VNPayResponseSerializer(serializers.Serializer):
    """Serializer for VNPAY return/IPN response"""
    
    success = serializers.BooleanField()
    message = serializers.CharField()
    transaction_id = serializers.CharField(required=False)
    order_number = serializers.CharField(required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    response_code = serializers.CharField(required=False)
