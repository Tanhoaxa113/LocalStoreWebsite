'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { vnpayAPI } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function VNPayReturnContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');

    useEffect(() => {
        const verifyPayment = async () => {
            if (!searchParams.toString()) return;

            try {
                const response = await vnpayAPI.verifyReturn(searchParams.toString());
                if (response.data.success) {
                    setStatus('success');
                    setMessage('Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.');
                } else {
                    setStatus('error');
                    setMessage(response.data.message || 'Thanh toán thất bại.');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực thanh toán.');
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-tet-gold animate-spin mb-4" />
                        <h2 className="text-xl font-bold mb-2">Đang xử lý...</h2>
                        <p className="text-text-muted">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-green-600">Thanh toán thành công!</h2>
                        <p className="text-text-muted mb-6">{message}</p>
                        <Link href="/account/orders" className="w-full">
                            <button className="btn-tet-primary w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold">
                                <span>Xem đơn hàng</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold mb-2 text-red-600">Thanh toán thất bại</h2>
                        <p className="text-text-muted mb-6">{message}</p>
                        <Link href="/account/orders" className="w-full">
                            <button className="w-full py-3 rounded-lg font-medium border border-border hover:bg-tet-cream transition-colors">
                                Quay lại danh sách đơn hàng
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VNPayReturnPage() {
    return (
        <DashboardLayout>
            <Suspense fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-tet-gold animate-spin" />
                </div>
            }>
                <VNPayReturnContent />
            </Suspense>
        </DashboardLayout>
    );
}
