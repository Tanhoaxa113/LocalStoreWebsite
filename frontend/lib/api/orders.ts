/**
 * Order Management API Client
 * TypeScript client for interacting with Order Management APIs
 */

import { api as apiClient } from '../api';

// Types
export interface User {
    id: string;
    email: string;
    full_name: string;
}

export interface Voucher {
    id: string;
    code: string;
    description: string;
    discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
    discount_value: string;
    discount_display: string;
    min_order_value: string;
    max_discount_amount: string | null;
    usage_limit: number | null;
    usage_per_user: number;
    times_used: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    is_valid: boolean;
    created_at: string;
}

export interface OrderItem {
    id: string;
    product_name: string;
    variant_sku: string;
    variant_details: Record<string, any>;
    unit_price: string;
    quantity: number;
    total_price: string;
}

export interface ShippingAddress {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    ward: string;
    district: string;
    city: string;
    postal_code: string;
    country: string;
    full_address: string;
}

export interface StatusHistory {
    id: string;
    from_status: string;
    from_status_display: string;
    to_status: string;
    to_status_display: string;
    note: string;
    changed_by_email: string | null;
    changed_by_name: string | null;
    created_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    email: string;
    phone: string;
    status: string;
    status_display: string;
    payment_method: string;
    payment_method_display: string;
    payment_status: string;
    payment_status_display: string;
    total: string;
    item_count?: number;
    created_at: string;
    updated_at: string;
}

export interface OrderDetail extends Order {
    payment_transaction_id: string;
    subtotal: string;
    shipping_cost: string;
    discount_amount: string;
    tracking_number: string;
    carrier: string;
    customer_note: string;
    admin_note: string;
    refund_reason: string;
    cancellation_reason: string;
    processing_notes: Record<string, any>;
    items: OrderItem[];
    shipping_address: ShippingAddress;
    status_history: StatusHistory[];
    applied_vouchers: Voucher[];
    can_cancel: boolean;
    can_confirm: boolean;
    can_mark_delivering: boolean;
    can_mark_delivered: boolean;
    can_request_refund: boolean;
    can_retry_payment?: boolean;
    time_until_expiration?: number;
    processing_at: string | null;
    confirmed_at: string | null;
    delivering_at: string | null;
    delivered_at: string | null;
    refunded_at: string | null;
    completed_at: string | null;
    canceled_at: string | null;
}

export interface OrderListParams {
    page?: number;
    page_size?: number;
    status?: string;
    payment_status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
}

export interface OrderListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Order[];
}

export interface OrderStats {
    total_orders_today: number;
    revenue_today: string;
    pending_confirmation_count: number;
    pending_refund_count: number;
    ready_to_ship_count: number;
    total_orders: number;
    total_revenue: string;
    status_breakdown: Record<string, { label: string; count: number }>;
}

export interface ConfirmOrderRequest {
    note?: string;
}

export interface ShipOrderRequest {
    tracking_number: string;
    carrier: string;
    note?: string;
}

export interface DeliverOrderRequest {
    note?: string;
}

export interface CancelOrderRequest {
    reason: string;
}

export interface ApproveRefundRequest {
    note?: string;
}

export interface RejectRefundRequest {
    reason: string;
}

export interface RequestRefundRequest {
    reason: string;
}

export interface ApiResponse<T = any> {
    message?: string;
    error?: string;
    order?: OrderDetail;
    data?: T;
}

// API Functions
export const OrderAPI = {
    /**
     * List orders with filtering and pagination
     */
    listOrders: async (params: OrderListParams = {}): Promise<OrderListResponse> => {
        const response = await apiClient.get<OrderListResponse>('/orders/', { params });
        return response.data;
    },

    /**
     * Get order detail by ID
     */
    getOrderDetail: async (orderId: string): Promise<OrderDetail> => {
        const response = await apiClient.get<OrderDetail>(`/orders/${orderId}/`);
        return response.data;
    },

    /**
     * Get dashboard statistics
     */
    getStats: async (): Promise<OrderStats> => {
        const response = await apiClient.get<OrderStats>('/orders/stats/');
        return response.data;
    },

    /**
     * Confirm order (CONFIRMING -> CONFIRMED)
     */
    confirmOrder: async (orderId: string, data: ConfirmOrderRequest = {}): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/confirm/`, data);
        return response.data;
    },

    /**
     * Mark order as delivering (CONFIRMED -> DELIVERING)
     */
    shipOrder: async (orderId: string, data: ShipOrderRequest): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/ship/`, data);
        return response.data;
    },

    /**
     * Mark order as delivered (DELIVERING -> DELIVERED)
     */
    deliverOrder: async (orderId: string, data: DeliverOrderRequest = {}): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/deliver/`, data);
        return response.data;
    },

    /**
     * Cancel order
     */
    cancelOrder: async (orderId: string, data: CancelOrderRequest): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/cancel/`, data);
        return response.data;
    },

    /**
     * Approve refund request
     */
    approveRefund: async (orderId: string, data: ApproveRefundRequest = {}): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/approve_refund/`, data);
        return response.data;
    },

    /**
     * Reject refund request
     */
    rejectRefund: async (orderId: string, data: RejectRefundRequest): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/reject_refund/`, data);
        return response.data;
    },

    /**
     * Customer requests refund
     */
    requestRefund: async (orderId: string, data: RequestRefundRequest): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/request_refund/`, data);
        return response.data;
    },

    /**
     * Customer cancels refund request
     */
    cancelRefundRequest: async (orderId: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/cancel_refund/`);
        return response.data;
    },

    /**
     * Customer completes order
     */
    completeOrder: async (orderId: string): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/complete/`);
        return response.data;
    },

    /**
     * Admin manually confirms refund
     */
    confirmRefunded: async (orderId: string, data: { note?: string } = {}): Promise<ApiResponse> => {
        const response = await apiClient.post<ApiResponse>(`/orders/${orderId}/confirm_refunded/`, data);
        return response.data;
    },

    /**
     * Retry payment for failed orders
     */
    retryPayment: async (orderId: string): Promise<{ success: boolean; payment_url?: string; transaction_id?: string; error?: string }> => {
        const response = await apiClient.post(`/orders/${orderId}/retry_payment/`);
        return response.data;
    },
};

// Voucher API
export const VoucherAPI = {
    /**
     * List all vouchers
     */
    listVouchers: async (): Promise<Voucher[]> => {
        const response = await apiClient.get<Voucher[]>('/vouchers/');
        return response.data;
    },

    /**
     * Get active vouchers
     */
    getActiveVouchers: async (): Promise<Voucher[]> => {
        const response = await apiClient.get<Voucher[]>('/vouchers/active/');
        return response.data;
    },

    /**
     * Validate voucher code
     */
    validateVoucher: async (code: string, orderTotal: string): Promise<{ valid: boolean; voucher?: Voucher; error?: string }> => {
        try {
            const response = await apiClient.post('/vouchers/validate/', {
                code,
                order_total: orderTotal,
            });
            return response.data;
        } catch (error: any) {
            return {
                valid: false,
                error: error.response?.data?.error || 'Validation failed',
            };
        }
    },
};

export default OrderAPI;
