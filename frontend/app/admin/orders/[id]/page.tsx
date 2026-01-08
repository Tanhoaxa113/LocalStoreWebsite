/**
 * Order Detail Page
 * Complete order information with action buttons for staff
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderAPI, OrderDetail } from '@/lib/api/orders';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import OrderTimeline from '@/components/admin/OrderTimeline';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal states
    const [showShipModal, setShowShipModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRejectRefundModal, setShowRejectRefundModal] = useState(false);

    // Form states
    const [trackingNumber, setTrackingNumber] = useState('');
    const [carrier, setCarrier] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const data = await OrderAPI.getOrderDetail(orderId);
            setOrder(data);
        } catch (error) {
            console.error('Failed to fetch order:', error);
            alert('Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    // Action handlers
    const handleConfirmOrder = async () => {
        if (!window.confirm('Xác nhận đơn hàng này?')) return;

        try {
            setActionLoading(true);
            await OrderAPI.confirmOrder(orderId);
            alert('Đơn hàng đã được xác nhận thành công!');
            fetchOrder();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    };

    const handleShipOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setActionLoading(true);
            await OrderAPI.shipOrder(orderId, { tracking_number: trackingNumber, carrier });
            alert('Đơn hàng đã được chuyển sang trạng thái giao hàng!');
            setShowShipModal(false);
            setTrackingNumber('');
            setCarrier('');
            fetchOrder();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeliverOrder = async () => {
        if (!window.confirm('Xác nhận đơn hàng đã được giao thành công?')) return;

        try {
            setActionLoading(true);
            await OrderAPI.deliverOrder(orderId);
            alert('Đơn hàng đã được đánh dấu là đã giao!');
            fetchOrder();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setActionLoading(true);
            await OrderAPI.cancelOrder(orderId, { reason: cancelReason });
            alert('Đơn hàng đã được hủy!');
            setShowCancelModal(false);
            setCancelReason('');
            fetchOrder();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveRefund = async () => {
        if (!window.confirm('Phê duyệt yêu cầu hoàn tiền này?')) return;

        try {
            setActionLoading(true);
            await OrderAPI.approveRefund(orderId);
            alert('Yêu cầu hoàn tiền đã được phê duyệt!');
            fetchOrder();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRefund = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setActionLoading(true);
            await OrderAPI.rejectRefund(orderId, { reason: rejectReason });
            alert('Yêu cầu hoàn tiền đã bị từ chối!');
            setShowRejectRefundModal(false);
            setRejectReason('');
            fetchOrder();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 text-lg mb-4">Không tìm thấy đơn hàng</p>
                    <Link href="/admin/orders" className="text-blue-600 hover:text-blue-800">
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/admin/orders" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Quay lại danh sách
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Đơn hàng #{order.order_number}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Đặt lúc {formatDate(order.created_at)}
                            </p>
                        </div>
                        <OrderStatusBadge status={order.status} statusDisplay={order.status_display} />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Thao tác</h2>
                    <div className="flex flex-wrap gap-3">
                        {order.can_confirm && (
                            <button
                                onClick={handleConfirmOrder}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Xác nhận đơn hàng
                            </button>
                        )}

                        {order.can_mark_delivering && (
                            <button
                                onClick={() => setShowShipModal(true)}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                                Giao hàng
                            </button>
                        )}

                        {order.can_mark_delivered && (
                            <button
                                onClick={handleDeliverOrder}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Đã giao thành công
                            </button>
                        )}

                        {order.status === 'REFUND_REQUESTED' && (
                            <>
                                <button
                                    onClick={handleApproveRefund}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Phê duyệt hoàn tiền
                                </button>
                                <button
                                    onClick={() => setShowRejectRefundModal(true)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Từ chối hoàn tiền
                                </button>
                            </>
                        )}

                        {order.can_cancel && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Hủy đơn hàng
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold">Sản phẩm</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{item.product_name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {Object.entries(item.variant_details).map(([key, value]) => (
                                                            value && <span key={key} className="mr-2">{value}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{item.variant_sku}</td>
                                                <td className="px-6 py-4 text-right text-sm">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-6 py-4 text-center text-sm">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                        <tr>
                                            <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700">Tạm tính:</td>
                                            <td className="px-6 py-3 text-right font-medium">{formatCurrency(order.subtotal)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700">Phí vận chuyển:</td>
                                            <td className="px-6 py-3 text-right font-medium">{formatCurrency(order.shipping_cost)}</td>
                                        </tr>
                                        {parseFloat(order.discount_amount) > 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-green-700">Giảm giá:</td>
                                                <td className="px-6 py-3 text-right font-medium text-green-700">-{formatCurrency(order.discount_amount)}</td>
                                            </tr>
                                        )}
                                        <tr className="border-t-2 border-gray-300">
                                            <td colSpan={4} className="px-6 py-4 text-right text-lg font-bold text-gray-900">Tổng cộng:</td>
                                            <td className="px-6 py-4 text-right text-lg font-bold text-gray-900">{formatCurrency(order.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Status History */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Lịch sử trạng thái</h2>
                            <OrderTimeline statusHistory={order.status_history} />
                        </div>
                    </div>

                    {/* Right Column - Customer & Payment Info */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Họ tên</p>
                                    <p className="font-medium">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{order.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Số điện thoại</p>
                                    <p className="font-medium">{order.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium">{order.shipping_address.full_name}</p>
                                <p>{order.shipping_address.phone}</p>
                                <p className="text-gray-600">{order.shipping_address.full_address}</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Thanh toán</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Phương thức</p>
                                    <p className="font-medium">{order.payment_method_display}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                            order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {order.payment_status_display}
                                    </span>
                                </div>
                                {order.payment_transaction_id && (
                                    <div>
                                        <p className="text-sm text-gray-500">Mã giao dịch</p>
                                        <p className="font-mono text-sm">{order.payment_transaction_id}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping Info */}
                        {(order.tracking_number || order.carrier) && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold mb-4">Vận chuyển</h2>
                                <div className="space-y-3">
                                    {order.carrier && (
                                        <div>
                                            <p className="text-sm text-gray-500">Đơn vị vận chuyển</p>
                                            <p className="font-medium">{order.carrier}</p>
                                        </div>
                                    )}
                                    {order.tracking_number && (
                                        <div>
                                            <p className="text-sm text-gray-500">Mã vận đơn</p>
                                            <p className="font-mono text-sm">{order.tracking_number}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {(order.customer_note || order.refund_reason || order.cancellation_reason) && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold mb-4">Ghi chú</h2>
                                <div className="space-y-3">
                                    {order.customer_note && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Ghi chú khách hàng:</p>
                                            <p className="text-sm text-gray-600 mt-1">{order.customer_note}</p>
                                        </div>
                                    )}
                                    {order.refund_reason && (
                                        <div>
                                            <p className="text-sm font-medium text-purple-700">Lý do hoàn tiền:</p>
                                            <p className="text-sm text-gray-600 mt-1">{order.refund_reason}</p>
                                        </div>
                                    )}
                                    {order.cancellation_reason && (
                                        <div>
                                            <p className="text-sm font-medium text-red-700">Lý do hủy đơn:</p>
                                            <p className="text-sm text-gray-600 mt-1">{order.cancellation_reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ship Order Modal */}
            {showShipModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Giao hàng</h3>
                        <form onSubmit={handleShipOrder}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Đơn vị vận chuyển *
                                    </label>
                                    <select
                                        value={carrier}
                                        onChange={(e) => setCarrier(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Chọn đơn vị vận chuyển</option>
                                        <option value="Viettel Post">Viettel Post</option>
                                        <option value="GHTK">GHTK</option>
                                        <option value="GHN">GHN</option>
                                        <option value="J&T Express">J&T Express</option>
                                        <option value="Ninja Van">Ninja Van</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mã vận đơn *
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        required
                                        placeholder="Nhập mã vận đơn"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowShipModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Hủy đơn hàng</h3>
                        <form onSubmit={handleCancelOrder}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lý do hủy *
                                </label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    required
                                    rows={4}
                                    placeholder="Nhập lý do hủy đơn hàng"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Refund Modal */}
            {showRejectRefundModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Từ chối hoàn tiền</h3>
                        <form onSubmit={handleRejectRefund}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lý do từ chối *
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    required
                                    rows={4}
                                    placeholder="Nhập lý do từ chối hoàn tiền"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectRefundModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
