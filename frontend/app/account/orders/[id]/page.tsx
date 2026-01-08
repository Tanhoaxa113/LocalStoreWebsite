'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Package, CreditCard, Calendar, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface OrderItem {
    id: number;
    product_name: string;
    variant_sku: string;
    variant_details: any;
    unit_price: string;
    quantity: number;
    total_price: string;
    image?: string; // Add if available in API
}

interface ShippingAddress {
    full_name: string;
    phone: string;
    full_address: string;
    city: string;
    country: string;
}

interface OrderDetail {
    id: number;
    order_number: string;
    status: string;
    status_display: string;
    payment_status: string;
    payment_status_display: string;
    payment_method: string;
    payment_method_display: string;
    subtotal: string;
    shipping_cost: string;
    discount_amount: string;
    total: string;
    items: OrderItem[];
    shipping_address: ShippingAddress;
    created_at: string;
    customer_note?: string;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipping: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
};

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchOrderDetail(params.id as string);
        }
    }, [params.id]);

    const fetchOrderDetail = async (id: string) => {
        try {
            const response = await api.get(`/orders/${id}/`);
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            // Handle error (e.g., redirect to orders list)
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!order || !window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

        try {
            await api.post(`/orders/${order.id}/cancel/`);
            fetchOrderDetail(order.id.toString()); // Refresh details
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
        }
    };

    const handleRetryPayment = async () => {
        if (!order) return;

        try {
            const response = await api.post('/payments/vnpay/create/', {
                order_id: order.id,
                payment_type: 'qr'
            });

            if (response.data.success && response.data.payment_url) {
                window.location.href = response.data.payment_url;
            } else {
                alert('Không thể tạo link thanh toán. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            alert('Có lỗi xảy ra khi tạo thanh toán.');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="bg-card rounded-2xl border border-border shadow-md p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-tet-gold border-t-transparent mx-auto mb-4"></div>
                    <p className="text-text-muted">Đang tải...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!order) {
        return (
            <DashboardLayout>
                <div className="bg-card rounded-2xl border border-border shadow-md p-12 text-center">
                    <p className="text-text-muted">Không tìm thấy đơn hàng.</p>
                    <Link href="/account/orders">
                        <button className="btn-tet-secondary mt-4">Quay lại danh sách</button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header & Back Button */}
                <div className="flex items-center gap-4">
                    <Link href="/account/orders">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-full hover:bg-tet-cream transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-foreground" />
                        </motion.button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gradient-tet font-display">
                        Đơn Hàng #{order.order_number}
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-tet-gold" />
                                Sản phẩm
                            </h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4 py-4 border-b border-border last:border-0">
                                        {/* Placeholder for Product Image - API needs to return this */}
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                            <ShoppingBag className="w-8 h-8 text-gray-400" />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-medium text-foreground">{item.product_name}</h3>
                                            <p className="text-sm text-text-muted mt-1">
                                                {Object.entries(item.variant_details).map(([key, value]) => (
                                                    <span key={key} className="mr-3 capitalize">
                                                        {key}: {String(value)}
                                                    </span>
                                                ))}
                                            </p>
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-sm">x{item.quantity}</p>
                                                <p className="font-medium text-tet-red">
                                                    {parseFloat(item.total_price).toLocaleString('vi-VN')}đ
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Info Cards Mobile */}
                        <div className="lg:hidden space-y-6">
                            {/* Shipping Info Mobile */}
                            <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-tet-gold" />
                                    Địa chỉ nhận hàng
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <p className="font-medium text-foreground">{order.shipping_address.full_name}</p>
                                    <p className="text-text-muted">{order.shipping_address.phone}</p>
                                    <p className="text-text-muted">{order.shipping_address.full_address}</p>
                                    <p className="text-text-muted">{order.shipping_address.country}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold text-foreground mb-4">Trạng thái</h2>
                            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
                                {order.status_display}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                                <div className="flex justify-between text-text-muted">
                                    <span>Ngày đặt:</span>
                                    <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex justify-between text-text-muted">
                                    <span>Phương thức:</span>
                                    <span>{order.payment_method_display}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted">Thanh toán:</span>
                                    <span className={order.payment_status === 'paid' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                                        {order.payment_status_display}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mt-6">
                                {['pending'].includes(order.status) && order.payment_status !== 'paid' && (
                                    <button
                                        onClick={handleRetryPayment}
                                        className="w-full py-2 px-4 bg-tet-gold text-tet-red-dark rounded-lg hover:bg-tet-gold/80 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Thanh toán lại
                                    </button>
                                )}

                                {['pending', 'confirmed'].includes(order.status) && (
                                    <button
                                        onClick={handleCancelOrder}
                                        className="w-full py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                                    >
                                        Hủy đơn hàng
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Shipping Address Desktop */}
                        <div className="hidden lg:block bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-tet-gold" />
                                Địa chỉ nhận hàng
                            </h2>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-foreground">{order.shipping_address.full_name}</p>
                                <p className="text-text-muted">{order.shipping_address.phone}</p>
                                <p className="text-text-muted">{order.shipping_address.full_address}</p>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-tet-gold" />
                                Thanh toán
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-text-muted">
                                    <span>Tạm tính</span>
                                    <span>{parseFloat(order.subtotal).toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between text-text-muted">
                                    <span>Phí vận chuyển</span>
                                    <span>{parseFloat(order.shipping_cost).toLocaleString('vi-VN')}đ</span>
                                </div>
                                {parseFloat(order.discount_amount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Giảm giá</span>
                                        <span>-{parseFloat(order.discount_amount).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-border flex justify-between items-center">
                                    <span className="font-bold text-foreground">Tổng cộng</span>
                                    <span className="text-xl font-bold text-tet-red">
                                        {parseFloat(order.total).toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
