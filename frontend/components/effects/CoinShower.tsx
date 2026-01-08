"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CoinShowerProps {
    x: number;
    y: number;
    onComplete?: () => void;
}

export default function CoinShower({ x, y, onComplete }: CoinShowerProps) {
    const [coins, setCoins] = useState<Array<{ id: number; offsetX: number; delay: number }>>([]);

    useEffect(() => {
        // Generate coins with random horizontal offsets
        const coinCount = 8;
        const newCoins = Array.from({ length: coinCount }, (_, i) => ({
            id: i,
            offsetX: (Math.random() - 0.5) * 60, // Random spread
            delay: i * 0.05, // Stagger animation
        }));
        setCoins(newCoins);

        // Auto-cleanup after animation
        const timer = setTimeout(() => {
            onComplete?.();
        }, 2000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div
            className="fixed pointer-events-none z-50"
            style={{
                left: x,
                top: y,
            }}
        >
            <AnimatePresence>
                {coins.map((coin) => (
                    <motion.div
                        key={coin.id}
                        initial={{
                            y: -50,
                            x: coin.offsetX,
                            rotate: 0,
                            opacity: 1,
                            scale: 0,
                        }}
                        animate={{
                            y: 200,
                            x: coin.offsetX,
                            rotate: 720,
                            opacity: 0,
                            scale: 1,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 2,
                            delay: coin.delay,
                            ease: "easeOut",
                        }}
                        className="absolute"
                    >
                        {/* Gold Coin */}
                        <div className="relative w-8 h-8">
                            {/* Coin face */}
                            <div
                                className="absolute inset-0 rounded-full flex items-center justify-center font-bold text-tet-red-dark"
                                style={{
                                    background: "linear-gradient(135deg, #FFF4A3 0%, #FFD700 100%)",
                                    boxShadow: "0 4px 8px rgba(197, 160, 89, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)",
                                    border: "2px solid #8B7355",
                                }}
                            >

                            </div>

                            {/* Shine effect */}
                            <motion.div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: "linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)",
                                }}
                                animate={{
                                    rotate: 360,
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
