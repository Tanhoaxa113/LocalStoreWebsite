'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, Eye } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { api } from '@/lib/api';

interface Order {
    id: number;
    order_number: string;
    status: string;
    status_display: string;
    payment_status: string;
    payment_status_display: string;
    payment_method: string;
    payment_method_display: string;
    total: string;
    item_count: number;
    created_at: string;
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

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders/');
            // Handle both paginated response (with results) and direct array
            const ordersData = Array.isArray(response.data)
                ? response.data
                : (response.data.results || []);
            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
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

    return (
        <DashboardLayout>
            <div className="bg-card rounded-2xl border border-border shadow-md p-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-tet-cream rounded-full">
                        <ShoppingBag className="w-6 h-6 text-tet-red" />
                    </div>
                    <h1 className="text-2xl font-bold text-gradient-tet font-display">
                        Đơn Hàng Của Tôi
                    </h1>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <p className="text-text-muted text-lg">Bạn chưa có đơn hàng nào</p>
                        <Link href="/products">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="btn-tet-primary mt-6"
                            >
                                Tiếp tục mua sắm
                            </motion.button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Link href={`/account/orders/${order.id}`} key={order.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="border border-border rounded-xl p-6 hover:shadow-lg transition-all bg-card cursor-pointer mb-4"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Order Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-lg text-gradient-tet">
                                                    #{order.order_number}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {order.status_display}
                                                </span>
                                            </div>

                                            <div className="text-sm text-text-muted space-y-1">
                                                <p>
                                                    <span className="font-medium">Ngày đặt:</span>{' '}
                                                    {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Số lượng:</span> {order.item_count} sản phẩm
                                                </p>
                                                <p>
                                                    <span className="font-medium">Thanh toán:</span> {order.payment_method_display}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Trạng thái thanh toán:</span>{' '}
                                                    <span
                                                        className={
                                                            order.payment_status === 'paid'
                                                                ? 'text-green-600'
                                                                : 'text-yellow-600'
                                                        }
                                                    >
                                                        {order.payment_status_display}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Total & Actions */}
                                        <div className="flex flex-col items-end gap-3">
                                            <div className="text-right">
                                                <p className="text-sm text-text-muted">Tổng tiền</p>
                                                <p className="text-2xl font-bold text-gradient-tet">
                                                    {parseFloat(order.total).toLocaleString('vi-VN')}đ
                                                </p>
                                            </div>


                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
