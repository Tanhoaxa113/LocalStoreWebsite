"use client";

import React, { useState } from 'react';
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { OrderAPI } from "@/lib/api/orders";

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    orderId: string;
    orderNumber: string;
}

export default function CancelOrderModal({
    isOpen,
    onClose,
    onConfirm,
    orderId,
    orderNumber
}: CancelOrderModalProps) {
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleConfirm = async () => {
        if (!reason.trim()) {
            setError("Vui lòng nhập lý do hủy đơn hàng");
            return;
        }

        try {
            setIsLoading(true);
            setError("");
            await OrderAPI.cancelOrder(orderId, { reason });
            onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || "Có lỗi xảy ra khi hủy đơn hàng");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Hủy đơn hàng #${orderNumber}`}
        >
            <div className="space-y-6">
                <p className="text-sm text-text-muted">
                    Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
                </p>

                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-100">
                    <p>
                        <strong>Lưu ý:</strong> Đối với đơn hàng đã thanh toán, hệ thống sẽ tự động hoàn tiền sau khi hủy thành công.
                    </p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="cancel-reason" className="text-sm font-medium text-foreground">
                        Lý do hủy đơn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="cancel-reason"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (e.target.value) setError("");
                        }}
                        placeholder="Vui lòng cho biết lý do hủy đơn hàng..."
                        className={`w-full min-h-[100px] px-3 py-2 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-tet-gold transition-colors resize-none
                            ${error ? "border-red-500 focus:ring-red-500" : "border-border"}
                        `}
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        type="button"
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        loading={isLoading}
                        type="button"
                        className="!bg-red-600 !border-red-600 hover:!bg-red-700 text-white"
                    >
                        Xác nhận hủy
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
