import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // For session-based auth
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem("auth_token");
            if (typeof window !== "undefined") {
                window.location.href = "/auth/login";
            }
        }
        return Promise.reject(error);
    }
);

// Types
export interface Product {
    id: number;
    name: string;
    slug: string;
    brand: string;
    category_name: string;
    short_description: string;
    base_price: string;
    price_range: { min: string; max: string } | null;
    thumbnail: string | null;
    default_variant: ProductVariant | null;
    is_active: boolean;
    is_featured: boolean;
    is_new_arrival: boolean;
    is_best_seller: boolean;
    in_stock: boolean;
    view_count: number;
}

export interface ProductDetail extends Product {
    description: string;
    target_gender: string;
    variants: ProductVariant[];
    media: ProductMedia[];
    total_stock: number;
    meta_title: string;
    meta_description: string;
}

export interface ProductVariant {
    id: number;
    sku: string;
    color: string;
    color_hex?: string;
    material: string;
    lens_type: string;
    size: string;
    price: string;
    sale_price?: string;
    display_price: string;
    is_on_sale: boolean;
    discount_percentage: number;
    stock: number;
    stock_status: "in_stock" | "low_stock" | "out_of_stock";
    is_active: boolean;
}

export interface ProductMedia {
    id: number;
    media_type: "image" | "video";
    thumbnail_url: string | null;
    medium_url: string | null;
    large_url: string | null;
    alt_text: string;
    display_order: number;
}

export interface CartItem {
    id: number;
    variant: ProductVariant;
    quantity: number;
    total_price: string;
    product_name: string;
    product_slug: string;
}

export interface Cart {
    id: string;
    items: CartItem[];
    total_items: number;
    subtotal: string;
}

export interface Order {
    id: number;
    order_number: string;
    status: string;
    status_display: string;
    payment_status: string;
    payment_method: string;
    total: string;
    created_at: string;
}

// API Functions
export const productsAPI = {
    // Get product list with filters
    getProducts: (params?: Record<string, any>) =>
        api.get<{ results: Product[]; count: number }>("/products/", { params }),

    // Get single product
    getProduct: (slug: string) =>
        api.get<ProductDetail>(`/products/${slug}/`),

    // Get featured products
    getFeatured: () =>
        api.get<Product[]>("/products/featured/"),

    // Get new arrivals
    getNewArrivals: () =>
        api.get<Product[]>("/products/new_arrivals/"),

    // Get best sellers
    getBestSellers: () =>
        api.get<Product[]>("/products/best_sellers/"),

    // Get related products
    getRelated: (slug: string) =>
        api.get<Product[]>(`/products/${slug}/related/`),
};

export const cartAPI = {
    // Get current cart
    getCart: () =>
        api.get<Cart>("/cart/"),

    // Add item to cart
    addItem: (variantId: number, quantity: number = 1) =>
        api.post<Cart>("/cart/add_item/", { variant_id: variantId, quantity }),

    // Update cart item quantity
    updateItem: (itemId: number, quantity: number) =>
        api.patch<Cart>("/cart/update_item/", { item_id: itemId, quantity }),

    // Remove item from cart
    removeItem: (itemId: number) =>
        api.delete<Cart>("/cart/remove_item/", { data: { item_id: itemId } }),

    // Clear cart
    clear: () =>
        api.post<Cart>("/cart/clear/"),

    // Check merge on login
    mergeCheck: (sessionKey: string) =>
        api.post("/cart/merge_check/", { session_key: sessionKey }),

    // Confirm merge
    mergeConfirm: (sessionKey: string, action: "merge" | "replace") =>
        api.post("/cart/merge_confirm/", { session_key: sessionKey, action }),
};

export const ordersAPI = {
    // Get user's orders
    getOrders: () =>
        api.get<Order[]>("/orders/"),

    // Get single order
    getOrder: (id: number) =>
        api.get<Order>(`/orders/${id}/`),

    // Create order from cart
    createOrder: (data: any) =>
        api.post("/orders/create_order/", data),

    // Cancel order
    cancelOrder: (id: number) =>
        api.post(`/orders/${id}/cancel/`),
};

export interface UserAddress {
    id: number;
    label: string;
    recipient_name: string;
    recipient_phone: string;
    address_line1: string;
    address_line2: string;
    city: string;
    district: string;
    ward: string;
    postal_code: string;
    country: string;
    is_default: boolean;
    full_address: string;
    created_at: string;
    updated_at: string;
}

export interface CreateOrderData {
    email: string;
    phone: string;
    shipping_full_name: string;
    shipping_phone: string;
    shipping_address_line1: string;
    shipping_address_line2?: string;
    shipping_ward?: string;
    shipping_district?: string;
    shipping_city: string;
    shipping_postal_code?: string;
    shipping_country: string;
    payment_method: 'vnpay_qr' | 'vnpay_card' | 'banking' | 'cod';
    customer_note?: string;
}

export const addressAPI = {
    // Get all addresses for current user
    list: () =>
        api.get<UserAddress[]>("/addresses/"),

    // Get single address
    get: (id: number) =>
        api.get<UserAddress>(`/addresses/${id}/`),

    // Create new address
    create: (data: Partial<UserAddress>) =>
        api.post<UserAddress>("/addresses/", data),

    // Update address
    update: (id: number, data: Partial<UserAddress>) =>
        api.patch<UserAddress>(`/addresses/${id}/`, data),

    // Delete address
    delete: (id: number) =>
        api.delete(`/addresses/${id}/`),

    // Set address as default
    setDefault: (id: number) =>
        api.post<UserAddress>(`/addresses/${id}/set_default/`),
};

export interface WishlistItem {
    id: number;
    product: Product;
    created_at: string;
}

export interface Wishlist {
    id: number;
    items: WishlistItem[];
    total_items: number;
}

export const wishlistAPI = {
    // Get user's wishlist
    getWishlist: () =>
        api.get<Wishlist>("/wishlist/"),

    // Add item to wishlist
    addItem: (productId: number, variantId?: number) =>
        api.post<Wishlist>("/wishlist/add_item/", {
            product_id: productId,
            variant_id: variantId
        }),

    // Remove item from wishlist
    removeItem: (productId: number) =>
        api.delete<Wishlist>("/wishlist/remove_item/", {
            data: { product_id: productId }
        }),

    // Clear wishlist
    clear: () =>
        api.post<Wishlist>("/wishlist/clear/"),

    // Check if product is in wishlist
    check: (productId: number) =>
        api.get<{ is_in_wishlist: boolean }>("/wishlist/check/", {
            params: { product_id: productId }
        }),
};

// VNPAY Payment API
export interface VNPayPaymentRequest {
    order_id: string;
    payment_type: 'qr' | 'card';
}

export interface VNPayPaymentResponse {
    success: boolean;
    payment_url?: string;
    transaction_id?: string;
    payment_id?: string;
    error?: string;
}

export interface VNPayReturnResponse {
    success: boolean;
    message: string;
    transaction_id?: string;
    order_number?: string;
    amount?: number;
    response_code?: string;
}

export const vnpayAPI = {
    // Create payment URL
    createPayment: (orderId: string, paymentType: 'qr' | 'card') =>
        api.post<VNPayPaymentResponse>('/payments/vnpay/create/', {
            order_id: orderId,
            payment_type: paymentType
        }),

    // Verify return from VNPAY
    verifyReturn: (queryString: string) =>
        api.get<VNPayReturnResponse>(`/payments/vnpay/return/?${queryString}`)
};

export default api;
