"use client";

import React, { useState } from 'react';
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { OrderAPI } from "@/lib/api/orders";

interface RefundRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    orderId: string;
    orderNumber: string;
}

export default function RefundRequestModal({
    isOpen,
    onClose,
    onConfirm,
    orderId,
    orderNumber
}: RefundRequestModalProps) {
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleConfirm = async () => {
        if (!reason.trim()) {
            setError("Vui lòng nhập lý do yêu cầu hoàn tiền");
            return;
        }

        try {
            setIsLoading(true);
            setError("");
            await OrderAPI.requestRefund(orderId, { reason });
            onConfirm();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || "Có lỗi xảy ra khi gửi yêu cầu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Yêu cầu hoàn tiền #${orderNumber}`}
        >
            <div className="space-y-6">
                <p className="text-sm text-text-muted">
                    Yêu cầu của bạn sẽ được gửi đến bộ phận CSKH để xem xét.
                </p>

                <div className="space-y-2">
                    <label htmlFor="refund-reason" className="text-sm font-medium text-foreground">
                        Lý do hoàn tiền <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="refund-reason"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (e.target.value) setError("");
                        }}
                        placeholder="Mô tả chi tiết lý do bạn muốn hoàn tiền..."
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
                    >
                        Gửi yêu cầu
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
