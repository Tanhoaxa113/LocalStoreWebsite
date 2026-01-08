/**
 * OrderTimeline Component
 * Displays order status history in a vertical timeline format
 */

import React from 'react';
import { StatusHistory } from '@/lib/api/orders';

interface OrderTimelineProps {
    statusHistory: StatusHistory[];
    className?: string;
}

export default function OrderTimeline({ statusHistory, className = '' }: OrderTimelineProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getStatusColor = (status: string): string => {
        const colorMap: Record<string, string> = {
            PENDING: 'bg-yellow-500',
            PROCESSING: 'bg-blue-500',
            PROCESSING_SUCCESS: 'bg-green-500',
            PROCESSING_FAILED: 'bg-red-500',
            CONFIRMING: 'bg-orange-500',
            CONFIRMED: 'bg-green-500',
            DELIVERING: 'bg-blue-500',
            DELIVERED: 'bg-green-500',
            REFUND_REQUESTED: 'bg-purple-500',
            REFUNDING: 'bg-purple-500',
            REFUNDED: 'bg-gray-500',
            COMPLETED: 'bg-emerald-500',
            CANCELED: 'bg-red-500',
        };
        return colorMap[status] || 'bg-gray-500';
    };

    if (!statusHistory || statusHistory.length === 0) {
        return (
            <div className={`text-gray-500 text-sm ${className}`}>
                Chưa có lịch sử thay đổi trạng thái
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Timeline */}
            <div className="space-y-6">
                {statusHistory.map((history, index) => {
                    const isLast = index === statusHistory.length - 1;

                    return (
                        <div key={history.id} className="relative flex gap-4">
                            {/* Timeline Line and Dot */}
                            <div className="relative flex flex-col items-center">
                                {/* Dot */}
                                <div
                                    className={`
                    w-4 h-4 rounded-full border-2 border-white shadow-md z-10
                    ${getStatusColor(history.to_status)}
                  `}
                                />
                                {/* Line */}
                                {!isLast && (
                                    <div className="w-0.5 h-full bg-gray-300 absolute top-4" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-6">
                                {/* Status Change */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-900">
                                        {history.from_status_display}
                                    </span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="font-medium text-gray-900">
                                        {history.to_status_display}
                                    </span>
                                </div>

                                {/* Timestamp */}
                                <div className="text-sm text-gray-500 mb-2">
                                    {formatDate(history.created_at)}
                                </div>

                                {/* Actor */}
                                {history.changed_by_name && (
                                    <div className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium">Người thực hiện:</span>{' '}
                                        {history.changed_by_name}
                                        {history.changed_by_email && (
                                            <span className="text-gray-500"> ({history.changed_by_email})</span>
                                        )}
                                    </div>
                                )}

                                {/* Note */}
                                {history.note && (
                                    <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">Ghi chú:</span> {history.note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
