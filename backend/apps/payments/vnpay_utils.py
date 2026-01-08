"""
VNPAY Payment Gateway Utilities
Handles URL generation, signature validation, and checksum creation
"""

import hashlib
import hmac
import urllib.parse
from datetime import datetime
from decimal import Decimal
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class VNPayConfig:
    """VNPAY Configuration Constants"""
    VERSION = '2.1.0'
    COMMAND = 'pay'
    CURRENCY_CODE = 'VND'
    LOCALE_VN = 'vn'
    LOCALE_EN = 'en'
    
    # Bank codes
    BANK_CODE_QR = 'VNPAYQR'  # QR Code payment
    BANK_CODE_ATM = 'VNBANK'  # ATM/Domestic cards
    
    # Response codes
    RESPONSE_CODE_SUCCESS = '00'
    RESPONSE_CODE_PENDING = '01'
    RESPONSE_CODE_ERROR = '02'
    RESPONSE_CODE_BLOCKED = '03'
    RESPONSE_CODE_FRAUD = '07'
    RESPONSE_CODE_TIMEOUT = '09'
    RESPONSE_CODE_WRONG_OTP = '10'
    RESPONSE_CODE_CANCELLED = '24'
    RESPONSE_CODE_INSUFFICIENT = '51'
    RESPONSE_CODE_DAILY_LIMIT = '65'
    RESPONSE_CODE_MAINTENANCE = '75'
    RESPONSE_CODE_WRONG_PASSWORD = '79'


def generate_secure_hash(params, secret_key):
    """
    Generate HMAC SHA512 hash for VNPAY parameters
    
    Args:
        params (dict): Dictionary of parameters (excluding vnp_SecureHash)
        secret_key (str): VNPAY secret key
    
    Returns:
        str: Hex digest of HMAC SHA512 hash
    """
    # Remove vnp_SecureHash if present and exclude empty values
    params_to_hash = {k: v for k, v in params.items() 
                      if k != 'vnp_SecureHash' and v is not None and str(v) != ''}
    
    # Sort parameters alphabetically by key
    sorted_params = sorted(params_to_hash.items())
    
    # Create query string
    # VNPAY requires URL encoding relative to standard
    query_string = '&'.join([f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in sorted_params])
    
    # Generate HMAC SHA512
    hash_value = hmac.new(
        secret_key.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()
    
    logger.debug(f"Generated hash for query: {query_string[:100]}...")
    
    return hash_value


def validate_signature(params, secret_key):
    """
    Validate VNPAY response signature
    
    Args:
        params (dict): Dictionary of parameters including vnp_SecureHash
        secret_key (str): VNPAY secret key
    
    Returns:
        bool: True if signature is valid, False otherwise
    """
    if 'vnp_SecureHash' not in params:
        logger.warning("Missing vnp_SecureHash in parameters")
        return False
    
    received_hash = params['vnp_SecureHash']
    calculated_hash = generate_secure_hash(params, secret_key)
    
    is_valid = received_hash == calculated_hash
    
    if not is_valid:
        logger.warning(f"Signature mismatch! Received: {received_hash[:20]}..., Calculated: {calculated_hash[:20]}...")
    
    return is_valid


def generate_transaction_id(order):
    """
    Generate unique transaction ID for payment
    
    Args:
        order: Order instance
    
    Returns:
        str: Unique transaction ID
    """
    # Format: ORD{order_id}_{timestamp}
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    # Use order number without special characters
    order_num = str(order.order_number).replace('DH', '')
    return f"{order_num}_{timestamp}"


def generate_payment_url(order, payment_type='qr', ip_address='127.0.0.1'):
    """
    Generate VNPAY payment URL
    
    Args:
        order: Order instance
        payment_type (str): 'qr' for QR code, 'card' for bank card
        ip_address (str): Customer IP address
    
    Returns:
        str: Complete VNPAY payment URL
    """
    # Generate transaction ID
    txn_ref = generate_transaction_id(order)
    
    # Convert amount to integer VND
    # VNPAY expects amount in the smallest currency unit
    # For VND: amount * 100 (e.g., 100,000 VND = 10,000,000 in smallest unit)
    amount = int(float(order.total) * 100)
    
    # Create timestamp
    create_date = datetime.now().strftime('%Y%m%d%H%M%S')
    
    # Build parameters
    vnp_params = {
        'vnp_Version': VNPayConfig.VERSION,
        'vnp_Command': VNPayConfig.COMMAND,
        'vnp_TmnCode': settings.VNPAY_TMN_CODE,
        'vnp_Amount': str(amount),  # Amount in smallest unit (VND * 100)
        'vnp_CurrCode': VNPayConfig.CURRENCY_CODE,
        'vnp_TxnRef': txn_ref,
        'vnp_OrderInfo': f'Payment for order {order.order_number}',
        'vnp_OrderType': 'billpayment',
        'vnp_Locale': VNPayConfig.LOCALE_VN,
        'vnp_ReturnUrl': settings.VNPAY_RETURN_URL,
        'vnp_IpAddr': ip_address,
        'vnp_CreateDate': create_date,
    }
    
    # Set bank code based on payment type
    if payment_type == 'qr':
        # VNPAYQR is often not enabled in Sandbox, leading to error 76.
        # Removing it allows the user to choose the payment method (including QR) on the VNPay gateway.
        pass
        # vnp_params['vnp_BankCode'] = VNPayConfig.BANK_CODE_QR
        logger.info(f"Generating QR payment URL for order {order.order_number} (Auto-select)")
    elif payment_type == 'card':
        vnp_params['vnp_BankCode'] = VNPayConfig.BANK_CODE_ATM
        logger.info(f"Generating Card payment URL for order {order.order_number}")
    else:
        # Default: let user choose
        logger.info(f"Generating default payment URL for order {order.order_number}")
    
    # Generate secure hash
    secure_hash = generate_secure_hash(vnp_params, settings.VNPAY_HASH_SECRET)
    vnp_params['vnp_SecureHash'] = secure_hash
    
    # Build final URL
    query_string = urllib.parse.urlencode(vnp_params)
    payment_url = f"{settings.VNPAY_PAYMENT_URL}?{query_string}"
    
    logger.info(f"Generated payment URL for transaction {txn_ref}")
    logger.debug(f"VNPAY Parameters: Amount={amount}, TxnRef={txn_ref}, OrderInfo={vnp_params['vnp_OrderInfo']}")
    
    return payment_url, txn_ref


def parse_vnpay_response(params):
    """
    Parse VNPAY response parameters
    
    Args:
        params (dict): Response parameters from VNPAY
    
    Returns:
        dict: Parsed response data with standardized keys
    """
    return {
        'transaction_id': params.get('vnp_TxnRef', ''),
        'gateway_transaction_id': params.get('vnp_TransactionNo', ''),
        'amount': int(params.get('vnp_Amount', 0)) / 100,  # Convert back from smallest unit
        'response_code': params.get('vnp_ResponseCode', ''),
        'bank_code': params.get('vnp_BankCode', ''),
        'bank_txn_no': params.get('vnp_BankTranNo', ''),
        'card_type': params.get('vnp_CardType', ''),
        'order_info': params.get('vnp_OrderInfo', ''),
        'pay_date': params.get('vnp_PayDate', ''),
        'transaction_status': params.get('vnp_TransactionStatus', ''),
        'secure_hash': params.get('vnp_SecureHash', ''),
        'raw_params': params
    }


def get_response_message(response_code):
    """
    Get human-readable message for VNPAY response code
    
    Args:
        response_code (str): VNPAY response code
    
    Returns:
        str: Human-readable message in Vietnamese
    """
    messages = {
        '00': 'Giao dịch thành công',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
        '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
        '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
        '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
        '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
        '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
        '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
        '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
        '75': 'Ngân hàng thanh toán đang bảo trì.',
        '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
        '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    }
    
    return messages.get(response_code, f'Lỗi không xác định (Mã: {response_code})')


def is_payment_successful(response_code):
    """
    Check if payment was successful
    
    Args:
        response_code (str): VNPAY response code
    
    Returns:
        bool: True if payment successful, False otherwise
    """
    return response_code == VNPayConfig.RESPONSE_CODE_SUCCESS
