'use client';

import { motion } from 'framer-motion';

/**
 * Tet Decorative Elements
 * Mai Vàng (Apricot Blossoms) and Lucky Envelopes
 */

export function MaiVangDecoration({ position = 'top-left' }: { position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
    const positionClasses = {
        'top-left': 'top-0 left-0',
        'top-right': 'top-0 right-0 scale-x-[-1]',
        'bottom-left': 'bottom-0 left-0 scale-y-[-1]',
        'bottom-right': 'bottom-0 right-0 scale-x-[-1] scale-y-[-1]',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
            className={`absolute ${positionClasses[position]} pointer-events-none z-0 overflow-hidden w-64 h-64`}
        >
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 256 256"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-40"
            >
                {/* Artistic Mai Branch */}
                <path
                    d="M-20 20 C 30 60, 60 40, 90 80 C 120 120, 100 160, 160 200"
                    stroke="#8B5A2B"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M90 80 C 100 50, 130 40, 150 20"
                    stroke="#8B5A2B"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d="M120 120 C 160 110, 180 130, 220 110"
                    stroke="#8B5A2B"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Mai Blossoms */}
                {[
                    { cx: 80, cy: 90, scale: 1 },
                    { cx: 160, cy: 200, scale: 0.8 },
                    { cx: 150, cy: 20, scale: 0.9 },
                    { cx: 220, cy: 110, scale: 0.8 },
                    { cx: 40, cy: 50, scale: 0.7 },
                    { cx: 120, cy: 120, scale: 0.6 },
                ].map((pos, i) => (
                    <g key={i} transform={`translate(${pos.cx}, ${pos.cy}) scale(${pos.scale})`}>
                        {/* Petals */}
                        {[0, 72, 144, 216, 288].map((angle, j) => (
                            <ellipse
                                key={j}
                                cx={Math.cos((angle * Math.PI) / 180) * 8}
                                cy={Math.sin((angle * Math.PI) / 180) * 8}
                                rx="8"
                                ry="5"
                                fill="#FFCC00"
                                transform={`rotate(${angle})`}
                            />
                        ))}
                        {/* Center Stamens */}
                        <circle cx="0" cy="0" r="3" fill="#FF9900" />
                        <circle cx="2" cy="-2" r="1" fill="#FFFFFF" opacity="0.5" />
                    </g>
                ))}
            </svg>
        </motion.div>
    );
}

export function LuckyEnvelopeIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                fill="url(#redGradient)"
                stroke="#C5A059"
                strokeWidth="1.5"
            />
            <path
                d="M3 8 L12 13 L21 8"
                stroke="#C5A059"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <text
                x="12"
                y="15"
                fontSize="8"
                fill="#FFD700"
                textAnchor="middle"
                fontWeight="bold"
            >
                福
            </text>
            <defs>
                <linearGradient id="redGradient" x1="3" y1="5" x2="21" y2="19">
                    <stop offset="0%" stopColor="#D42426" />
                    <stop offset="100%" stopColor="#8B0000" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function TetBanner({ text }: { text: string }) {
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative inline-block"
        >
            <div className="lucky-envelope px-8 py-4 rounded-lg">
                <span className="text-tet-gold-light font-bold text-lg tracking-wide">
                    {text}
                </span>
            </div>
        </motion.div>
    );
}
