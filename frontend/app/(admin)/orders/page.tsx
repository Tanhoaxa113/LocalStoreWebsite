/**
 * Sales Manager Dashboard - Order List Page
 * Displays all orders with filtering, search, and statistics
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderAPI, Order, OrderStats, OrderListParams } from '@/lib/api/orders';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<OrderListParams>({
        page: 1,
        page_size: 20,
    });
    const [totalCount, setTotalCount] = useState(0);

    // Fetch orders
    useEffect(() => {
        fetchOrders();
    }, [filters]);

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await OrderAPI.listOrders(filters);
            setOrders(response.results);
            setTotalCount(response.count);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            alert('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await OrderAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleFilterChange = (key: keyof OrderListParams, value: any) => {
        setFilters({ ...filters, [key]: value, page: 1 });
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gradient-tet mb-2">
                        Quản Lý Đơn Hàng
                    </h1>

                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-card rounded-lg shadow p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Đơn hàng hôm nay</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.total_orders_today}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-text-muted mt-2">
                                {formatCurrency(stats.revenue_today)}
                            </p>
                        </div>

                        <div className="bg-card rounded-lg shadow p-6 border-l-4 border-orange-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Chờ xác nhận</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.pending_confirmation_count}</p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-orange-600 mt-2">Cần xử lý ngay</p>
                        </div>

                        <div className="bg-card rounded-lg shadow p-6 border-l-4 border-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Yêu cầu hoàn tiền</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.pending_refund_count}</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-purple-600 mt-2">Cần phê duyệt</p>
                        </div>

                        <div className="bg-card rounded-lg shadow p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Sẵn sàng giao</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.ready_to_ship_count}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-green-600 mt-2">Đã xác nhận</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-card rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Tìm kiếm
                            </label>
                            <input
                                type="text"
                                placeholder="Mã đơn hàng, email, số điện thoại..."
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Trạng thái
                            </label>
                            <select
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="PENDING">Chờ xác nhận</option>
                                <option value="PROCESSING">Đang xử lý</option>
                                <option value="CONFIRMING">Chờ xác nhận</option>
                                <option value="CONFIRMED">Đã xác nhận</option>
                                <option value="DELIVERING">Đang giao hàng</option>
                                <option value="DELIVERED">Giao thành công</option>
                                <option value="REFUND_REQUESTED">Yêu cầu hoàn tiền</option>
                                <option value="COMPLETED">Hoàn thành</option>
                                <option value="CANCELED">Đã hủy</option>
                            </select>
                        </div>

                        {/* Payment Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Thanh toán
                            </label>
                            <select
                                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                                value={filters.payment_status || ''}
                                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="pending">Chờ thanh toán</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="failed">Thất bại</option>
                                <option value="refunded">Đã hoàn tiền</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-card rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">
                            Không tìm thấy đơn hàng nào
                        </div>
                    ) : (
                        <>
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Đơn hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Khách hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Thanh toán
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Tổng tiền
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Ngày đặt
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gradient-fortune">{order.order_number}</div>
                                                <div className="text-sm text-text-muted">{order.item_count} sản phẩm</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">{order.customer_name}</div>
                                                <div className="text-sm text-text-muted">{order.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <OrderStatusBadge status={order.status} statusDisplay={order.status_display} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.payment_status_display}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                {formatCurrency(order.total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Xem chi tiết
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                                        disabled={(filters.page || 1) <= 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                                        disabled={(filters.page || 1) * (filters.page_size || 20) >= totalCount}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-foreground">
                                            Hiển thị{' '}
                                            <span className="font-medium">
                                                {((filters.page || 1) - 1) * (filters.page_size || 20) + 1}
                                            </span>{' '}
                                            đến{' '}
                                            <span className="font-medium">
                                                {Math.min((filters.page || 1) * (filters.page_size || 20), totalCount)}
                                            </span>{' '}
                                            trong tổng số{' '}
                                            <span className="font-medium">{totalCount}</span> kết quả
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex items-center rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                                                disabled={(filters.page || 1) <= 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-text-muted hover:bg-muted disabled:opacity-50"
                                            >
                                                <span className="sr-only">Trước</span>
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-border bg-card text-sm font-medium text-foreground">
                                                Trang {filters.page || 1}
                                            </span>
                                            <button
                                                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                                                disabled={(filters.page || 1) * (filters.page_size || 20) >= totalCount}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-text-muted hover:bg-muted disabled:opacity-50"
                                            >
                                                <span className="sr-only">Sau</span>
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
