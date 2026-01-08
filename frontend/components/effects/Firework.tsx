"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FireworkProps {
    x: number;
    y: number;
    onComplete?: () => void;
}

export default function Firework({ x, y, onComplete }: FireworkProps) {
    const [particles, setParticles] = useState<Array<{ id: number; angle: number; color: string }>>([]);

    useEffect(() => {
        // Generate particles in a circular pattern
        const particleCount = 12;
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            angle: (360 / particleCount) * i,
            color: i % 2 === 0 ? "#FFF4A3" : "#D42426", // Bright Gold and Red
        }));
        setParticles(newParticles);

        // Auto-cleanup after animation
        const timer = setTimeout(() => {
            onComplete?.();
        }, 1000);

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
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            x: 0,
                            y: 0,
                            scale: 1,
                            opacity: 1,
                        }}
                        animate={{
                            x: Math.cos((particle.angle * Math.PI) / 180) * 100,
                            y: Math.sin((particle.angle * Math.PI) / 180) * 100,
                            scale: 0,
                            opacity: 0,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut",
                        }}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            backgroundColor: particle.color,
                            boxShadow: `0 0 10px ${particle.color}`,
                        }}
                    />
                ))}

                {/* Center burst */}
                <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-tet-gold-light"
                    style={{
                        boxShadow: "0 0 20px #FFF4A3",
                    }}
                />
            </AnimatePresence>
        </div>
    );
}
