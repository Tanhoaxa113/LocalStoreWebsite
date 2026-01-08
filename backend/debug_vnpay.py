"""
Debug script to test VNPAY parameter generation
Run this to verify all parameters are correctly formatted
"""

import sys
import os
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order
from apps.payments.vnpay_utils import generate_payment_url
from decimal import Decimal

print("=" * 80)
print("VNPAY Parameter Debug Script")
print("=" * 80)

# Get the most recent order
try:
    order = Order.objects.latest('created_at')
    print(f"\n✓ Found order: {order.order_number}")
    print(f"  Total: {order.total} VND")
    print(f"  Type: {type(order.total)}")
    
    # Generate payment URL
    print("\n" + "=" * 80)
    print("Generating Payment URL...")
    print("=" * 80)
    
    payment_url, txn_ref = generate_payment_url(order, payment_type='qr')
    
    print(f"\n✓ Transaction ID: {txn_ref}")
    print(f"\n✓ Payment URL Generated:")
    print(f"  {payment_url[:100]}...")
    
    # Parse and display all parameters
    print("\n" + "=" * 80)
    print("VNPAY Parameters:")
    print("=" * 80)
    
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(payment_url)
    params = parse_qs(parsed.query)
    
    for key in sorted(params.keys()):
        value = params[key][0] if isinstance(params[key], list) else params[key]
        print(f"  {key:20s} = {value}")
    
    # Specific validations
    print("\n" + "=" * 80)
    print("Validation Checks:")
    print("=" * 80)
    
    vnp_amount = params.get('vnp_Amount', [''])[0]
    print(f"\n1. Amount Check:")
    print(f"   Original: {order.total} VND")
    print(f"   Converted: {int(float(order.total) * 100)}")
    print(f"   vnp_Amount: {vnp_amount}")
    print(f"   ✓ Is numeric: {vnp_amount.isdigit()}")
    print(f"   ✓ No decimals: {'.' not in vnp_amount}")
    
    vnp_order_info = params.get('vnp_OrderInfo', [''])[0]
    print(f"\n2. OrderInfo Check:")
    print(f"   Value: {vnp_order_info}")
    print(f"   ✓ ASCII only: {vnp_order_info.isascii()}")
    print(f"   Length: {len(vnp_order_info)} chars")
    
    vnp_secure_hash = params.get('vnp_SecureHash', [''])[0]
    print(f"\n3. Signature Check:")
    print(f"   Hash length: {len(vnp_secure_hash)} chars")
    print(f"   ✓ Present: {len(vnp_secure_hash) > 0}")
    
    print(
        f"\n4. Required Parameters:")
    required_params = [
        'vnp_Version', 'vnp_Command', 'vnp_TmnCode', 'vnp_Amount',
        'vnp_CurrCode', 'vnp_TxnRef', 'vnp_OrderInfo', 'vnp_OrderType',
        'vnp_Locale', 'vnp_ReturnUrl', 'vnp_IpAddr', 'vnp_CreateDate'
    ]
    
    for param in required_params:
        present = param in params
        symbol = "✓" if present else "✗"
        print(f"   {symbol} {param}")
    
    print("\n" + "=" * 80)
    print("✓ Debug Complete!")
    print("=" * 80)
    print("\nIf all checks pass but VNPAY still shows error:")
    print("1. Verify VNPAY_TMN_CODE in .env matches your sandbox account")
    print("2. Verify VNPAY_HASH_SECRET is correct (no extra spaces)")
    print("3. Check Django logs for any errors during URL generation")
    print("4. Try the payment URL in an incognito window")
    
except Order.DoesNotExist:
    print("\n✗ No orders found in database")
    print("  Create an order first through the checkout flow")
except Exception as e:
    print(f"\n✗ Error occurred: {str(e)}")
    import traceback
    traceback.print_exc()
