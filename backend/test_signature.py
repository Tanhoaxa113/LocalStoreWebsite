"""
Test script to verify VNPAY signature generation
This will help identify if the hash secret is correct
"""

import sys
import os
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from apps.payments.vnpay_utils import generate_secure_hash
import urllib.parse

print("=" * 80)
print("VNPAY Signature Verification Test")
print("=" * 80)

# Sample parameters (from VNPAY documentation)
test_params = {
    'vnp_Version': '2.1.0',
    'vnp_Command': 'pay',
    'vnp_TmnCode': settings.VNPAY_TMN_CODE,
    'vnp_Amount': '1000000',
    'vnp_CurrCode': 'VND',
    'vnp_TxnRef': 'TEST123',
    'vnp_OrderInfo': 'Test payment',
    'vnp_OrderType': 'billpayment',
    'vnp_Locale': 'vn',
    'vnp_ReturnUrl': 'http://localhost:8000/return',
    'vnp_IpAddr': '127.0.0.1',
    'vnp_CreateDate': '20240101120000',
}

print("\nCurrent Configuration:")
print(f"  Merchant Code: {settings.VNPAY_TMN_CODE}")
print(f"  Hash Secret: {settings.VNPAY_HASH_SECRET}")
print(f"  Secret Length: {len(settings.VNPAY_HASH_SECRET)} chars")

# Generate hash
hash_value = generate_secure_hash(test_params, settings.VNPAY_HASH_SECRET)

print(f"\nGenerated Signature:")
print(f"  {hash_value}")

# Create hash input string for verification
sorted_params = sorted(test_params.items())
hash_input = '&'.join([f"{k}={v}" for k, v in sorted_params])

print(f"\nHash Input String:")
print(f"  {hash_input[:100]}...")

print("\n" + "=" * 80)
print("Troubleshooting Steps:")
print("=" * 80)

print("\n1. Verify your VNPAY credentials:")
print("   - Go to VNPAY sandbox dashboard")
print("   - Check Terminal ID (Mã Terminal) matches VNPAY_TMN_CODE")
print("   - Check Hash Secret (Mã bảo mật) matches VNPAY_HASH_SECRET")

print("\n2. Common issues:")
print("   - Hash secret has extra spaces (before/after)")
print("   - Wrong hash secret copied from dashboard")
print("   - Merchant code is wrong")
print("   - Using production credentials in sandbox (or vice versa)")

print("\n3. If you're not sure about credentials:")
print("   - Contact VNPAY support")
print("   - Or use their test/demo credentials from documentation")

print("\n" + "=" * 80)
