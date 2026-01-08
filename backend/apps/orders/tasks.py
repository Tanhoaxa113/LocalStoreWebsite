"""
Celery Tasks for Order Processing
Handles async order validation, inventory management, and notifications
"""

from celery import shared_task
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class InsufficientStockError(Exception):
    """Raised when product stock is insufficient for order"""
    pass


class PriceChangedError(Exception):
    """Raised when product price has changed since cart was created"""
    pass


class VoucherError(Exception):
    """Raised when voucher validation fails"""
    pass


@shared_task(bind=True, max_retries=3)
def process_order_async(self, order_id):
    """
    Main orchestrator task for order processing pipeline
    
    Workflow:
    1. Transition to PROCESSING status
    2. Validate order items (stock availability)
    3. Validate pricing
    4. Validate and apply vouchers
    5. Deduct inventory atomically
    6. Transition to PROCESSING_SUCCESS -> CONFIRMING
    7. Increment voucher usage counters
    8. Send notification to customer and staff
    
    On failure: Transition to PROCESSING_FAILED and send notification
    """
    from apps.orders.models import Order, OrderStatus
    
    try:
        order = Order.objects.get(pk=order_id)
        
        # Step 1: Transition to PROCESSING
        if not order.transition_to(OrderStatus.PROCESSING, note="System started processing"):
            logger.error(f"Order {order_id} not in valid state for processing")
            return
        
        logger.info(f"Processing order {order_id}")
        
        # Step 2: Validate items and inventory
        try:
            validate_order_items(order)
        except InsufficientStockError as e:
            handle_processing_failure(order, str(e), error_code='STOCK_UNAVAILABLE')
            return
        
        # Step 3: Validate pricing
        try:
            validate_pricing(order)
        except PriceChangedError as e:
            handle_processing_failure(order, str(e), error_code='PRICE_CHANGED')
            return
        
        # Step 4: Validate and apply vouchers
        try:
            validate_and_apply_vouchers(order)
        except VoucherError as e:
            handle_processing_failure(order, str(e), error_code='VOUCHER_INVALID')
            return
        
        # Step 5: Deduct inventory atomically (with locking)
        try:
            deduct_inventory(order)
        except InsufficientStockError as e:
            handle_processing_failure(order, str(e), error_code='STOCK_DEDUCTION_FAILED')
            return
        
        # Step 6: Success - transition to PROCESSING_SUCCESS
        order.transition_to(
            OrderStatus.PROCESSING_SUCCESS,
            note="Validation passed, stock reserved"
        )
        
        # Step 7: Auto-transition to CONFIRMING
        order.transition_to(
            OrderStatus.CONFIRMING,
            note="Ready for staff confirmation"
        )
        
        # Step 8: Increment voucher usage counters
        for voucher in order.applied_vouchers.all():
            voucher.increment_usage()
        
        # Step 9: Send notifications
        send_order_notification.delay(order_id, 'order_confirmed')
        send_order_notification.delay(order_id, 'staff_new_order')
        
        logger.info(f"Order {order_id} processed successfully")
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found")
    except Exception as exc:
        logger.error(f"Error processing order {order_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


def handle_processing_failure(order, error_message, error_code='UNKNOWN'):
    """Handle order processing failure with detailed error codes"""
    from apps.orders.models import OrderStatus
    
    # Update processing notes with detailed error
    order.processing_notes = {
        'status': 'failed',
        'error': error_message,
        'error_code': error_code,
        'timestamp': timezone.now().isoformat()
    }
    order.save(update_fields=['processing_notes'])
    
    # Transition to failed state
    order.transition_to(
        OrderStatus.PROCESSING_FAILED,
        note=f"Processing failed [{error_code}]: {error_message}"
    )
    
    # Send failure notification to customer
    send_order_notification.delay(order.id, 'order_failed')
    
    logger.warning(f"Order {order.id} processing failed [{error_code}]: {error_message}")


def validate_order_items(order):
    """
    Validate that all order items are available in requested quantities
    
    This is a preliminary check before the atomic deduction
    Raises InsufficientStockError if validation fails
    """
    from apps.products.models import ProductVariant
    
    validation_results = []
    
    for item in order.items.select_related('variant'):
        if not item.variant:
            raise InsufficientStockError(f"Product variant for {item.variant_sku} no longer exists")
        
        variant = item.variant
        
        # Check if variant is still active
        if not variant.is_active:
            raise InsufficientStockError(f"{variant.sku} is no longer available")
        
        # Check stock availability
        if variant.stock < item.quantity:
            raise InsufficientStockError(
                f"Insufficient stock for {variant.sku}. "
                f"Available: {variant.stock}, Requested: {item.quantity}"
            )
        
        validation_results.append({
            'sku': variant.sku,
            'requested': item.quantity,
            'available': variant.stock,
            'status': 'ok'
        })
    
    # Store validation results
    order.processing_notes = {
        'validation': validation_results,
        'timestamp': timezone.now().isoformat()
    }
    order.save(update_fields=['processing_notes'])
    
    logger.info(f"Order {order.id} item validation passed")


def validate_pricing(order):
    """
    Validate that prices haven't changed since order was created
    
    This prevents situations where user adds items to cart with one price,
    but prices change before checkout completes
    
    Raises PriceChangedError if prices have changed
    """
    price_changes = []
    
    for item in order.items.select_related('variant'):
        if not item.variant:
            continue
        
        variant = item.variant
        current_price = variant.get_display_price()
        
        # Check if price has changed
        if current_price != item.unit_price:
            price_changes.append({
                'sku': variant.sku,
                'old_price': str(item.unit_price),
                'new_price': str(current_price),
            })
    
    if price_changes:
        error_msg = "Prices have changed: " + ", ".join(
            [f"{pc['sku']}: {pc['old_price']} → {pc['new_price']}" for pc in price_changes]
        )
        raise PriceChangedError(error_msg)
    
    logger.info(f"Order {order.id} pricing validation passed")


def deduct_inventory(order):
    """
    Atomically deduct inventory with database-level locking
    
    CRITICAL: This function uses select_for_update() to prevent race conditions
    when multiple orders are processed simultaneously for the same product
    
    Raises InsufficientStockError if stock becomes unavailable during deduction
    """
    from apps.products.models import ProductVariant
    
    with transaction.atomic():
        # Process each order item
        for item in order.items.select_related('variant'):
            if not item.variant:
                continue
            
            # CRITICAL: Lock the variant row to prevent concurrent modifications
            # This ensures no other transaction can update this variant's stock
            # until this transaction completes
            variant = ProductVariant.objects.select_for_update().get(id=item.variant.id)
            
            # Double-check stock availability (could have changed since validation)
            if variant.stock < item.quantity:
                raise InsufficientStockError(
                    f"Insufficient stock for {variant.sku} during deduction. "
                    f"Available: {variant.stock}, Requested: {item.quantity}"
                )
            
            # Deduct stock
            variant.stock -= item.quantity
            variant.save(update_fields=['stock', 'updated_at'])
            
            logger.info(
                f"Deducted {item.quantity} units of {variant.sku}. "
                f"Remaining stock: {variant.stock}"
            )
    
    logger.info(f"Inventory deducted successfully for order {order.id}")


def validate_and_apply_vouchers(order):
    """
    Validate vouchers and recalculate order total
    
    Raises VoucherError if any voucher is invalid
    """
    vouchers = list(order.applied_vouchers.all())
    
    if not vouchers:
        return  # No vouchers to apply
    
    # Validate each voucher
    for voucher in vouchers:
        can_use, error_message = voucher.can_use(order.user, order.subtotal)
        
        if not can_use:
            raise VoucherError(f"Voucher {voucher.code}: {error_message}")
    
    # Recalculate discount
    total_discount = Decimal('0.00')
    voucher_details = []
    
    for voucher in vouchers:
        discount = voucher.calculate_discount(order.subtotal, order.shipping_cost)
        total_discount += discount
        
        voucher_details.append({
            'code': voucher.code,
            'type': voucher.discount_type,
            'discount': str(discount)
        })
    
    # Update order totals
    order.discount_amount = total_discount
    order.total = order.subtotal + order.shipping_cost - order.discount_amount
    order.save(update_fields=['discount_amount', 'total'])
    
    # Log discount details
    order.processing_notes = order.processing_notes or {}
    order.processing_notes['vouchers_applied'] = voucher_details
    order.save(update_fields=['processing_notes'])
    
    logger.info(f"Applied {len(vouchers)} vouchers to order {order.id}, total discount: {total_discount}")


@shared_task
def send_order_notification(order_id, event_type):
    """
    Send email notifications for order events
    
    Event types:
    - order_confirmed: Send to customer when order is confirmed
    - order_failed: Send to customer when processing fails
    - order_shipped: Send to customer when order ships
    - order_delivered: Send to customer when order is delivered
    - refund_requested: Send to staff when refund is requested
    - staff_new_order: Send to staff when new order needs confirmation
    """
    from apps.orders.models import Order
    from django.core.mail import send_mail
    from django.conf import settings
    
    try:
        order = Order.objects.get(pk=order_id)
        
        email_templates = {
            'order_confirmed': {
                'subject': f'Đơn hàng #{order.order_number} đã được xác nhận',
                'recipient': order.email,
                'message': f"""
                Xin chào {order.user.full_name if order.user else 'Quý khách'},
                
                Đơn hàng #{order.order_number} của bạn đã được xác nhận và đang chờ xử lý.
                
                Tổng giá trị: {order.total} VNĐ
                Phương thức thanh toán: {order.get_payment_method_display()}
                
                Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.
                
                Cảm ơn bạn đã mua hàng!
                """
            },
            'order_failed': {
                'subject': f'Đơn hàng #{order.order_number} xử lý thất bại',
                'recipient': order.email,
                'message': f"""
                Xin chào {order.user.full_name if order.user else 'Quý khách'},
                
                Rất tiếc, đơn hàng #{order.order_number} của bạn không thể xử lý.
                
                Lý do: {order.processing_notes.get('error', 'Unknown error')}
                
                Vui lòng liên hệ với chúng tôi để được hỗ trợ.
                """
            },
            'order_shipped': {
                'subject': f'Đơn hàng #{order.order_number} đang được giao',
                'recipient': order.email,
                'message': f"""
                Xin chào {order.user.full_name if order.user else 'Quý khách'},
                
                Đơn hàng #{order.order_number} của bạn đang được giao.
                
                Mã vận đơn: {order.tracking_number}
                Đơn vị vận chuyển: {order.carrier}
                
                Vui lòng theo dõi đơn hàng của bạn.
                """
            },
            'staff_new_order': {
                'subject': f'Đơn hàng mới #{order.order_number} cần xác nhận',
                'recipient': settings.DEFAULT_FROM_EMAIL,  # Send to staff
                'message': f"""
                Đơn hàng mới cần xác nhận:
                
                Mã đơn: {order.order_number}
                Khách hàng: {order.email}
                Tổng giá trị: {order.total} VNĐ
                Ngày đặt: {order.created_at}
                
                Vui lòng xác nhận đơn hàng trong hệ thống quản lý.
                """
            },
        }
        
        if event_type in email_templates:
            template = email_templates[event_type]
            send_mail(
                subject=template['subject'],
                message=template['message'],
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[template['recipient']],
                fail_silently=False,
            )
            logger.info(f"Sent {event_type} email for order {order_id}")
        else:
            logger.warning(f"Unknown event type: {event_type}")
            
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for notification")
    except Exception as e:
        logger.error(f"Error sending notification for order {order_id}: {str(e)}")


@shared_task
def check_expired_orders():
    """
    Periodic task to check and cancel expired pending orders
    
    Run this via Celery Beat every 5 minutes
    """
    from apps.orders.models import Order, OrderStatus
    
    # Find pending orders older than 15 minutes
    expiration_threshold = timezone.now() - timedelta(minutes=15)
    
    expired_orders = Order.objects.filter(
        status=OrderStatus.PENDING,
        created_at__lt=expiration_threshold
    )
    
    count = 0
    for order in expired_orders:
        if order.check_expiration():
            count += 1
            logger.info(f"Auto-canceled expired order {order.order_number}")
    
    logger.info(f"Checked expired orders: {count} canceled")
    return count


@shared_task(bind=True, max_retries=3)
def process_refund_async(self, order_id, refund_reason=''):
    """
    Process refund asynchronously
    
    Workflow:
    1. Validate refund eligibility
    2. Transition to REFUNDING
    3. Process payment gateway refund
    4. Restore inventory atomically
    5. Transition to REFUNDED
    6. Update payment status
    """
    from apps.orders.models import Order, OrderStatus
    from django.db import transaction
    
    try:
        order = Order.objects.select_for_update().get(pk=order_id)
        
        # Validate refund eligibility
        if order.status != OrderStatus.REFUND_REQUESTED:
            logger.error(f"Order {order_id} not in refund requested state")
            return
        
        with transaction.atomic():
            # Transition to REFUNDING
            order.transition_to(
                OrderStatus.REFUNDING,
                note=f"Processing refund: {refund_reason}"
            )
            
            # Process payment gateway refund
            try:
                refund_transaction_id = process_payment_gateway_refund(order)
                
                order.processing_notes = order.processing_notes or {}
                order.processing_notes['refund'] = {
                    'transaction_id': refund_transaction_id,
                    'amount': str(order.total),
                    'reason': refund_reason or order.refund_reason,
                    'timestamp': timezone.now().isoformat()
                }
                order.save(update_fields=['processing_notes'])
                
            except PaymentGatewayError as e:
                logger.error(f"Payment gateway refund failed for order {order_id}: {str(e)}")
                # Don't fail the entire process - manual intervention may be needed
                order.admin_note += f"\n[REFUND ERROR] {str(e)}"
                order.save(update_fields=['admin_note'])
            
            # Restore inventory
            try:
                order.restore_inventory()
            except Exception as e:
                logger.error(f"Inventory restoration failed for order {order.id}: {str(e)}")
                raise  # This should fail the transaction
            
            # Transition to REFUNDED
            order.transition_to(
                OrderStatus.REFUNDED,
                note="Refund completed and inventory restored"
            )
            
            # Update payment status
            order.payment_status = 'refunded'
            order.save(update_fields=['payment_status'])
        
        # Send refund confirmation notification
        send_order_notification.delay(order_id, 'refund_completed')
        
        logger.info(f"Refund processed successfully for order {order_id}")
        
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found")
    except Exception as exc:
        logger.error(f"Error processing refund for order {order_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=300)  # Retry after 5 minutes


class PaymentGatewayError(Exception):
    """Raised when payment gateway operation fails"""
    pass


def process_payment_gateway_refund(order):
    """
    Process refund through payment gateway (VNPAY, etc.)
    
    Returns:
        str: Refund transaction ID
    
    Raises:
        PaymentGatewayError: If refund fails
    """
    # TODO: Integrate with actual payment gateway
    # This is a structure for VNPAY or other Vietnamese payment gateways
    
    if order.payment_method.startswith('vnpay'):
        # VNPAY Refund API structure placeholder
        # See technical specification for full implementation guide
        logger.warning(f"Payment gateway refund NOT IMPLEMENTED - order {order.id}")
        return f"REFUND_{order.order_number}_{int(timezone.now().timestamp())}"
    
    elif order.payment_method == 'cod':
        # COD orders don't need payment gateway refund
        return 'COD_NO_REFUND_NEEDED'
    
    else:
        logger.warning(f"Unknown payment method for refund: {order.payment_method}")
        return 'MANUAL_REFUND_REQUIRED'


@shared_task
def auto_complete_delivered_orders():
    """
    Auto-complete delivered orders after configured days
    
    Run this via Celery Beat daily at 2 AM
    """
    from apps.orders.models import Order, OrderStatus
    from django.conf import settings
    from datetime import timedelta
    
    auto_complete_days = getattr(settings, 'AUTO_COMPLETE_DAYS', 7)
    cutoff_date = timezone.now() - timedelta(days=auto_complete_days)
    
    # Find delivered orders older than threshold
    eligible_orders = Order.objects.filter(
        status=OrderStatus.DELIVERED,
        delivered_at__lt=cutoff_date
    )
    
    count = 0
    for order in eligible_orders:
        if order.transition_to(
            OrderStatus.COMPLETED,
            note=f"Auto-completed after {auto_complete_days} days"
        ):
            count += 1
            logger.info(f"Auto-completed order {order.order_number}")
    
    logger.info(f"Auto-completed {count} delivered orders")
    return count
