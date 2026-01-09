'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Package, CreditCard, ShoppingBag, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { OrderAPI, OrderDetail } from '@/lib/api/orders';
import CancelOrderModal from '@/components/order/CancelOrderModal';
import RefundRequestModal from '@/components/order/RefundRequestModal';
import PaymentExpirationTimer from '@/components/order/PaymentExpirationTimer';

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    DELIVERING: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELED: 'bg-red-100 text-red-800',
    REFUND_REQUESTED: 'bg-orange-100 text-orange-800',
    REFUNDING: 'bg-orange-100 text-orange-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function OrderDetailsPage() {
    const params = useParams();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [statusUpdateFlash, setStatusUpdateFlash] = useState(false);

    // Modal states
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    // Processing states
    const [isRetryingPayment, setIsRetryingPayment] = useState(false);

    // WebSocket: Real-time order status updateseStatusUpdate);

    useEffect(() => {
        if (params.id) {
            fetchOrderDetail(params.id as string);
        }
    }, [params.id]);

    const fetchOrderDetail = async (id: string) => {
        try {
            setErrorMsg('');
            const data = await OrderAPI.getOrderDetail(id);
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            setErrorMsg('Không thể tải thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleRetryPayment = async () => {
        if (!order) return;

        try {
            setIsRetryingPayment(true);
            const response = await OrderAPI.retryPayment(order.id.toString());

            if (response.success && response.payment_url) {
                window.location.href = response.payment_url;
            } else {
                alert(response.error || 'Không thể tạo link thanh toán');
            }
        } catch (error: any) {
            console.error('Error creating payment:', error);
            alert(error.response?.data?.error || 'Có lỗi xảy ra khi tạo thanh toán');
        } finally {
            setIsRetryingPayment(false);
        }
    };

    const handleOrderExpired = async () => {
        // Refresh order to show cancelled status
        if (order?.id) {
            fetchOrderDetail(order.id.toString());
        }
    };

    const handleCancelRefundRequest = async () => {
        if (!order) return;
        if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu hoàn tiền?')) return;

        try {
            setLoading(true);
            await OrderAPI.cancelRefundRequest(order.id.toString());
            fetchOrderDetail(order.id.toString());
        } catch (error: any) {
            console.error('Error canceling refund request:', error);
            alert(error.response?.data?.error || 'Không thể hủy yêu cầu hoàn tiền');
            setLoading(false);
        }
    };

    const handleCompleteOrder = async () => {
        if (!order) return;
        if (!confirm('Bạn xác nhận đã nhận được hàng và muốn hoàn tất đơn hàng?')) return;

        try {
            setLoading(true);
            await OrderAPI.completeOrder(order.id.toString());
            fetchOrderDetail(order.id.toString());
        } catch (error: any) {
            console.error('Error completing order:', error);
            alert(error.response?.data?.error || 'Không thể hoàn tất đơn hàng');
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

    if (!order) {
        return (
            <DashboardLayout>
                <div className="bg-card rounded-2xl border border-border shadow-md p-12 text-center">
                    <p className="text-text-muted">Không tìm thấy đơn hàng.</p>
                    <Link href="/account/orders">
                        <button className="px-6 h-12 rounded-full bg-background border-2 border-tet-red text-foreground hover:bg-tet-cream shadow-md transition-all mt-4">
                            Quay lại danh sách
                        </button>
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

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Items */}
                        <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gradient-gold w-fit">
                                <Package className="w-5 h-5 text-tet-gold" />
                                Sản phẩm
                            </h2>
                            <div className="space-y-4">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex items-start gap-4 py-4 border-b border-border last:border-0">
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-medium text-foreground">{item.product_name}</h3>
                                            <p className="text-sm text-text-muted mt-1">
                                                {item.variant_details && Object.entries(item.variant_details).map(([key, value]) => (
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
                            <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gradient-gold w-fit">
                                    <MapPin className="w-5 h-5 text-tet-gold" />
                                    Địa chỉ nhận hàng
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <p className="font-medium text-foreground">{order.shipping_address?.full_name}</p>
                                    <p className="text-text-muted">{order.shipping_address?.phone}</p>
                                    <p className="text-text-muted">{order.shipping_address?.full_address}</p>
                                    <p className="text-text-muted">{order.shipping_address?.country}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold mb-4 text-gradient-gold w-fit">Trạng thái</h2>

                            <div className="flex flex-col gap-4">
                                <div className={`inline-flex self-start px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                                    {order.status_display}
                                </div>

                                {/* Payment Expiration Timer */}
                                {order.status === 'PENDING' &&
                                    order.payment_status !== 'paid' &&
                                    (order.time_until_expiration || 0) > 0 && (
                                        <PaymentExpirationTimer
                                            secondsRemaining={order.time_until_expiration || 0}
                                            onExpire={handleOrderExpired}
                                        />
                                    )}
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
                                {/* Financial_Action_Button Logic */}
                                {/* Scenario 1: PaymentStatus IN ['PENDING', 'FAILED'] -> Pay Again */}
                                {['pending', 'failed'].includes(order.payment_status) && order.can_retry_payment && (
                                    <button
                                        onClick={handleRetryPayment}
                                        disabled={isRetryingPayment}
                                        className="w-full py-2 px-4 bg-tet-gold text-tet-red-dark rounded-lg hover:bg-tet-gold/80 transition-colors text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        {isRetryingPayment ? 'Đang xử lý...' : 'Thanh toán lại'}
                                    </button>
                                )}

                                {/* Scenario 2: OrderStatus == 'DELIVERED' AND PaymentStatus == 'SUCCESS' -> Request Refund */}
                                {order.status === 'DELIVERED' && order.payment_status === 'paid' && order.can_request_refund && (
                                    <button
                                        onClick={() => setIsRefundModalOpen(true)}
                                        className="w-full py-2 px-4 bg-white border border-tet-gold text-tet-gold rounded-lg hover:bg-tet-gold/10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        Yêu cầu hoàn tiền
                                    </button>
                                )}

                                {/* Scenario 3: OrderStatus == 'REFUND_REQUESTED' -> Cancel Refund Request */}
                                {order.status === 'REFUND_REQUESTED' && (
                                    <button
                                        onClick={handleCancelRefundRequest}
                                        className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                        Hủy yêu cầu hoàn tiền
                                    </button>
                                )}


                                {/* Lifecycle_Action_Button Logic */}
                                {/* Scenario 1: OrderStatus IN ['PENDING', 'CONFIRMED', 'PROCESSING_SUCCESS'] -> Cancel Order */}
                                {['PENDING', 'CONFIRMED', 'PROCESSING_SUCCESS', 'CONFIRMING'].includes(order.status) && (
                                    <button
                                        onClick={() => setIsCancelModalOpen(true)}
                                        className="w-full py-2 px-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                                    >
                                        Hủy đơn hàng
                                    </button>
                                )}

                                {/* Scenario 2: OrderStatus == 'DELIVERED' -> Complete Order */}
                                {order.status === 'DELIVERED' && (
                                    <button
                                        onClick={handleCompleteOrder}
                                        className="w-full py-2 px-4 bg-tet-red text-white rounded-lg hover:bg-tet-red/90 transition-colors text-sm font-bold shadow-md"
                                    >
                                        Hoàn tất đơn hàng
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Shipping Address Desktop */}
                        <div className="hidden lg:block bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gradient-gold w-fit">
                                <MapPin className="w-5 h-5 text-tet-gold" />
                                Địa chỉ nhận hàng
                            </h2>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-foreground">{order.shipping_address?.full_name}</p>
                                <p className="text-text-muted">{order.shipping_address?.phone}</p>
                                <p className="text-text-muted">{order.shipping_address?.full_address}</p>
                                <p className="text-text-muted">{order.shipping_address?.country}</p>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="bg-card rounded-2xl border border-border shadow-md p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gradient-gold w-fit">
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

                {/* Modals */}
                {order && (
                    <>
                        <CancelOrderModal
                            isOpen={isCancelModalOpen}
                            onClose={() => setIsCancelModalOpen(false)}
                            onConfirm={() => fetchOrderDetail(order.id.toString())}
                            orderId={order.id.toString()}
                            orderNumber={order.order_number}
                        />

                        <RefundRequestModal
                            isOpen={isRefundModalOpen}
                            onClose={() => setIsRefundModalOpen(false)}
                            onConfirm={() => fetchOrderDetail(order.id.toString())}
                            orderId={order.id.toString()}
                            orderNumber={order.order_number}
                        />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
