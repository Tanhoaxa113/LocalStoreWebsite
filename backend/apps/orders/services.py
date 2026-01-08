"""
Order Service Layer
Encapsulates business logic for order management operations
"""

from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class OrderService:
    """
    Service class for order management operations
    Provides high-level business logic and status transition management
    """
    
    @staticmethod
    def create_order(user, cart_items, shipping_address_data, payment_method, voucher_codes=None):
        """
        Create a new order from cart items
        
        Args:
            user: User model instance (can be None for guest checkout)
            cart_items: List of cart item objects
            shipping_address_data: Dict with shipping address fields
            payment_method: Payment method code
            voucher_codes: Optional list of voucher codes to apply
        
        Returns:
            Order instance
        
        Raises:
            ValueError: If cart is empty or invalid data provided
        """
        from apps.orders.models import Order, OrderItem, ShippingAddress, OrderStatus, Voucher
        from apps.orders.tasks import process_order_async
        
        if not cart_items:
            raise ValueError("Cannot create order from empty cart")
        
        with transaction.atomic():
            # Calculate totals
            subtotal = Decimal('0.00')
            items_data = []
            
            for cart_item in cart_items:
                variant = cart_item.variant
                unit_price = variant.get_display_price()
                quantity = cart_item.quantity
                total_price = unit_price * quantity
                
                subtotal += total_price
                
                items_data.append({
                    'variant': variant,
                    'product_name': variant.product.name,
                    'variant_sku': variant.sku,
                    'variant_details': {
                        'color': variant.color,
                        'size': variant.size,
                        'material': variant.material,
                        'lens_type': variant.lens_type,
                    },
                    'unit_price': unit_price,
                    'quantity': quantity,
                    'total_price': total_price,
                })
            
            # Calculate shipping cost
            shipping_cost = Decimal('30000.00')  # 30k VND flat rate
            
            # Pre-validate vouchers
            vouchers = []
            if voucher_codes:
                for code in voucher_codes:
                    try:
                        voucher = Voucher.objects.get(code=code.upper())
                        can_use, error_msg = voucher.can_use(user, subtotal)
                        
                        if not can_use:
                            raise ValueError(f"Voucher {code}: {error_msg}")
                        
                        vouchers.append(voucher)
                    except Voucher.DoesNotExist:
                        raise ValueError(f"Voucher {code} không tồn tại")
            
            # Calculate initial discount (will be recalculated in async task)
            discount_amount = Decimal('0.00')
            for voucher in vouchers:
                discount_amount += voucher.calculate_discount(subtotal, shipping_cost)
            
            # Calculate total
            total = subtotal + shipping_cost - discount_amount
            
            # Create order
            order = Order.objects.create(
                user=user,
                email=user.email if user else shipping_address_data.get('email'),
                phone=shipping_address_data.get('phone'),  # Always get phone from shipping data
                status=OrderStatus.PENDING,
                payment_method=payment_method,
                payment_status='pending',
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                discount_amount=discount_amount,
                total=total,
            )
            
            # Apply vouchers
            if vouchers:
                order.applied_vouchers.set(vouchers)
            
            # Create order items
            for item_data in items_data:
                OrderItem.objects.create(
                    order=order,
                    **item_data
                )
            
            # Create shipping address
            ShippingAddress.objects.create(
                order=order,
                **shipping_address_data
            )
        
        # Trigger async processing
        process_order_async.delay(order.id)
        
        logger.info(f"Created order {order.order_number} for user {user.email if user else 'guest'}")
        
        return order
    
    @staticmethod
    def confirm_order(order, staff_user):
        """
        Staff confirms order (CONFIRMING -> CONFIRMED)
        
        Args:
            order: Order instance
            staff_user: Staff user confirming the order
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order is not in CONFIRMING status
        """
        from apps.orders.models import OrderStatus
        from apps.orders.tasks import send_order_notification
        
        if not order.can_confirm():
            raise ValueError(f"Order {order.order_number} is not in confirmable state")
        
        success = order.transition_to(
            OrderStatus.CONFIRMED,
            actor=staff_user,
            note=f"Confirmed by staff: {staff_user.email}"
        )
        
        if success:
            # Send confirmation notification
            send_order_notification.delay(order.id, 'order_confirmed')
            logger.info(f"Order {order.order_number} confirmed by {staff_user.email}")
        
        return success
    
    @staticmethod
    def mark_as_delivering(order, staff_user, tracking_number, carrier):
        """
        Mark order as delivering (CONFIRMED -> DELIVERING)
        
        Args:
            order: Order instance
            staff_user: Staff user marking as shipped
            tracking_number: Tracking number from carrier
            carrier: Carrier name (e.g., "Viettel Post", "GHTK")
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order is not in CONFIRMED status
        """
        from apps.orders.models import OrderStatus
        from apps.orders.tasks import send_order_notification
        
        if not order.can_mark_delivering():
            raise ValueError(f"Order {order.order_number} is not in shippable state")
        
        # Update tracking info
        order.tracking_number = tracking_number
        order.carrier = carrier
        order.save(update_fields=['tracking_number', 'carrier'])
        
        success = order.transition_to(
            OrderStatus.DELIVERING,
            actor=staff_user,
            note=f"Shipped via {carrier}, tracking: {tracking_number}"
        )
        
        if success:
            # Send shipping notification
            send_order_notification.delay(order.id, 'order_shipped')
            logger.info(f"Order {order.order_number} marked as delivering")
        
        return success
    
    @staticmethod
    def mark_as_delivered(order, staff_user=None):
        """
        Mark order as delivered (DELIVERING -> DELIVERED)
        
        Args:
            order: Order instance
            staff_user: Optional staff user (can be system)
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order is not in DELIVERING status
        """
        from apps.orders.models import OrderStatus
        
        if not order.can_mark_delivered():
            raise ValueError(f"Order {order.order_number} is not in delivery")
        
        success = order.transition_to(
            OrderStatus.DELIVERED,
            actor=staff_user,
            note="Delivered to customer"
        )
        
        if success:
            logger.info(f"Order {order.order_number} marked as delivered")
        
        return success
    
    @staticmethod
    def request_refund(order, user, reason):
        """
        Customer requests refund (COMPLETED/DELIVERED -> REFUND_REQUESTED)
        
        Args:
            order: Order instance
            user: User requesting refund
            reason: Refund reason
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order is not eligible for refund
        """
        from apps.orders.models import OrderStatus
        
        if not order.can_request_refund():
            raise ValueError(
                f"Order {order.order_number} is not eligible for refund. "
                f"Must be paid and completed/delivered."
            )
        
        # Store refund reason
        order.refund_reason = reason
        order.save(update_fields=['refund_reason'])
        
        success = order.transition_to(
            OrderStatus.REFUND_REQUESTED,
            actor=user,
            note=f"Refund requested: {reason}"
        )
        
        if success:
            logger.info(f"Refund requested for order {order.order_number}")
        
        return success
    
    @staticmethod
    def approve_refund(order, staff_user):
        """
        Staff approves refund (REFUND_REQUESTED -> REFUNDING -> REFUNDED)
        Enhanced to use async refund processing task
        
        Args:
            order: Order instance
            staff_user: Staff user approving refund
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order is not in REFUND_REQUESTED status
        """
        from apps.orders.models import OrderStatus
        from apps.orders.tasks import process_refund_async
        
        if order.status != OrderStatus.REFUND_REQUESTED:
            raise ValueError(f"Order {order.order_number} is not in refund requested state")
        
        # Trigger async refund processing
        process_refund_async.delay(order.id, order.refund_reason)
        
        logger.info(f"Refund processing initiated for order {order.order_number} by {staff_user.email}")
        
        return True
    
    @staticmethod
    def confirm_refunded(order, staff_user, note=None):
        """
        Manually confirm that a refund has been processed (REFUNDING -> REFUNDED)
        
        Args:
            order: Order instance
            staff_user: Staff user confirming the refund
            note: Optional note
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order is not in REFUNDING status
        """
        from apps.orders.models import OrderStatus
        
        if order.status != OrderStatus.REFUNDING:
            raise ValueError(f"Order {order.order_number} is not in REFUNDING state")
        
        # Transition to REFUNDED
        success = order.transition_to(
            OrderStatus.REFUNDED,
            actor=staff_user,
            note=note or "Manual refund confirmation by staff"
        )
        
        if success:
            # Update payment status
            order.payment_status = 'refunded'
            order.save(update_fields=['payment_status'])
            
            logger.info(f"Refund manually confirmed for order {order.order_number} by {staff_user.email}")
        
        return success
    
    @staticmethod
    def reject_refund(order, staff_user, rejection_reason):
        """
        Reject refund request and return order to previous state
        
        Args:
            order: Order instance
            staff_user: Staff user rejecting refund
            rejection_reason: Reason for rejection
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order is not in REFUND_REQUESTED status
        """
        from apps.orders.models import OrderStatus
        
        if order.status != OrderStatus.REFUND_REQUESTED:
            raise ValueError(f"Order {order.order_number} is not in refund requested state")
        
        # Determine previous state (DELIVERED or COMPLETED)
        previous_status = OrderStatus.DELIVERED  # Default
        
        last_history = order.status_history.exclude(
            to_status=OrderStatus.REFUND_REQUESTED
        ).order_by('-created_at').first()
        
        if last_history:
            previous_status = last_history.to_status
        
        # Transition back to previous state
        success = order.transition_to(
            previous_status,
            actor=staff_user,
            note=f"Refund rejected: {rejection_reason}"
        )
        
        # Update admin note with rejection reason
        order.admin_note += f"\n[REFUND REJECTED] {rejection_reason}"
        order.save(update_fields=['admin_note'])
        
        if success:
            logger.info(f"Refund rejected for order {order.order_number} by {staff_user.email}")
        
        return success
    
    @staticmethod
    def cancel_order(order, actor, reason):
        """
        Cancel order and restore inventory
        
        Args:
            order: Order instance
            actor: User canceling the order
            reason: Cancellation reason
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If order cannot be canceled
        """
        if not order.can_cancel():
            raise ValueError(
                f"Order {order.order_number} cannot be canceled in current state: {order.status}"
            )
        
        success = order.cancel_order(actor=actor, reason=reason)
        
        if success:
            logger.info(f"Order {order.order_number} canceled by {actor.email if actor else 'system'}")
            
            # Auto-trigger refund if payment was successful
            if order.payment_status == 'paid':
                try:
                    from apps.orders.tasks import process_refund_async
                    # Use a default reason for auto-refund
                    refund_reason = f"Auto-refund for canceled order. Original cancellation reason: {reason}"
                    process_refund_async.delay(order.id, refund_reason)
                    logger.info(f"Auto-triggered async refund for canceled order {order.order_number}")
                except Exception as e:
                    logger.error(f"Failed to auto-trigger refund for order {order.order_number}: {e}")
        
        return success
    
    @staticmethod
    def cancel_refund_request(order, user):
        """
        User cancels their refund request (REFUND_REQUESTED -> DELIVERED)
        
        Args:
            order: Order instance
            user: User canceling request
        
        Returns:
            bool: True if successful
        """
        from apps.orders.models import OrderStatus
        
        if order.status != OrderStatus.REFUND_REQUESTED:
            raise ValueError(f"Order {order.order_number} is not in refund requested state")
            
        success = order.transition_to(
            OrderStatus.DELIVERED,
            actor=user,
            note="User canceled refund request"
        )
        
        if success:
            logger.info(f"Refund request canceled for order {order.order_number} by {user.email}")
            
        return success

    @staticmethod
    def complete_order(order, user):
        """
        User completes order (DELIVERED -> COMPLETED)
        
        Args:
            order: Order instance
            user: User completing order
            
        Returns:
            bool: True if successful
        """
        from apps.orders.models import OrderStatus
        
        if order.status != OrderStatus.DELIVERED:
            raise ValueError(f"Order {order.order_number} is not in delivered state")
            
        success = order.transition_to(
            OrderStatus.COMPLETED,
            actor=user,
            note="User completed order"
        )
        
        if success:
            logger.info(f"Order {order.order_number} completed by {user.email}")
            
        return success
