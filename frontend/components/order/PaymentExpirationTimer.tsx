"use client";

import React, { useState, useEffect } from 'react';

interface PaymentExpirationTimerProps {
    secondsRemaining: number;
    onExpire: () => void;
}

export default function PaymentExpirationTimer({
    secondsRemaining,
    onExpire
}: PaymentExpirationTimerProps) {
    const [timeLeft, setTimeLeft] = useState(secondsRemaining);

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const isUrgent = timeLeft < 300; // Less than 5 mins

    return (
        <div className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border
            ${isUrgent
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }
        `}>
            <svg
                className={`w-5 h-5 ${isUrgent ? 'animate-pulse' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
                Hết hạn thanh toán sau: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
}
