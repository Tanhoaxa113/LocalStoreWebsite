/**
 * OrderStatusBadge Component
 * Displays order status with appropriate color coding
 */

import React from 'react';

interface StatusConfig {
    label: string;
    colorClass: string;
    bgClass: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
    PENDING: {
        label: 'Chờ xác nhận',
        colorClass: 'text-yellow-800',
        bgClass: 'bg-yellow-100 border-yellow-300',
    },
    PROCESSING: {
        label: 'Đang xử lý',
        colorClass: 'text-blue-800',
        bgClass: 'bg-blue-100 border-blue-300',
    },
    PROCESSING_SUCCESS: {
        label: 'Xử lý thành công',
        colorClass: 'text-green-800',
        bgClass: 'bg-green-100 border-green-300',
    },
    PROCESSING_FAILED: {
        label: 'Xử lý thất bại',
        colorClass: 'text-red-800',
        bgClass: 'bg-red-100 border-red-300',
    },
    CONFIRMING: {
        label: 'Chờ xác nhận',
        colorClass: 'text-orange-800',
        bgClass: 'bg-orange-100 border-orange-300',
    },
    CONFIRMED: {
        label: 'Đã xác nhận',
        colorClass: 'text-green-800',
        bgClass: 'bg-green-100 border-green-300',
    },
    DELIVERING: {
        label: 'Đang giao hàng',
        colorClass: 'text-blue-800',
        bgClass: 'bg-blue-100 border-blue-300',
    },
    DELIVERED: {
        label: 'Giao thành công',
        colorClass: 'text-green-800',
        bgClass: 'bg-green-100 border-green-300',
    },
    REFUND_REQUESTED: {
        label: 'Yêu cầu hoàn tiền',
        colorClass: 'text-purple-800',
        bgClass: 'bg-purple-100 border-purple-300',
    },
    REFUNDING: {
        label: 'Đang hoàn tiền',
        colorClass: 'text-purple-800',
        bgClass: 'bg-purple-100 border-purple-300',
    },
    REFUNDED: {
        label: 'Đã hoàn tiền',
        colorClass: 'text-gray-800',
        bgClass: 'bg-gray-100 border-gray-300',
    },
    COMPLETED: {
        label: 'Hoàn thành',
        colorClass: 'text-emerald-800',
        bgClass: 'bg-emerald-100 border-emerald-300',
    },
    CANCELED: {
        label: 'Đã hủy',
        colorClass: 'text-red-800',
        bgClass: 'bg-red-100 border-red-300',
    },
};

interface OrderStatusBadgeProps {
    status: string;
    statusDisplay?: string;
    className?: string;
    showIcon?: boolean;
}

export default function OrderStatusBadge({
    status,
    statusDisplay,
    className = '',
    showIcon = true
}: OrderStatusBadgeProps) {
    const config = STATUS_CONFIGS[status] || {
        label: statusDisplay || status,
        colorClass: 'text-gray-800',
        bgClass: 'bg-gray-100 border-gray-300',
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'PENDING':
            case 'CONFIRMING':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'PROCESSING':
                return (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                );
            case 'PROCESSING_SUCCESS':
            case 'CONFIRMED':
            case 'DELIVERED':
            case 'COMPLETED':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'PROCESSING_FAILED':
            case 'CANCELED':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'DELIVERING':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                );
            case 'REFUND_REQUESTED':
            case 'REFUNDING':
            case 'REFUNDED':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border
        ${config.colorClass} ${config.bgClass} ${className}
      `}
        >
            {showIcon && getStatusIcon()}
            {config.label}
        </span>
    );
}
