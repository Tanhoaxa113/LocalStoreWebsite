"use client";

import { motion } from "framer-motion";

interface ApricotDecorProps {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    className?: string;
}

export default function ApricotDecor({
    position = "top-right",
    className = ""
}: ApricotDecorProps) {
    const positionClasses = {
        "top-left": "top-0 left-0",
        "top-right": "top-0 right-0",
        "bottom-left": "bottom-0 left-0",
        "bottom-right": "bottom-0 right-0",
    };

    const rotation = {
        "top-left": 0,
        "top-right": 90,
        "bottom-left": -90,
        "bottom-right": 180,
    };

    return (
        <motion.div
            className={`fixed ${positionClasses[position]} pointer-events-none z-10 opacity-30 ${className}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ rotate: rotation[position] }}
        >
            <svg
                width="200"
                height="250"
                viewBox="0 0 200 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="filter drop-shadow-lg"
            >
                {/* Branch */}
                <path
                    d="M10 250Q50 200 80 150T100 50"
                    stroke="#8B7355"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                />

                {/* Side branches */}
                <path d="M60 180Q80 160 100 150" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M75 130Q90 115 100 105" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M85 90Q95 75 100 65" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" fill="none" />

                {/* Apricot Blossoms */}
                <ApricotBlossom x={110} y={140} delay={0.2} />
                <ApricotBlossom x={105} y={95} delay={0.4} />
                <ApricotBlossom x={102} y={55} delay={0.6} />
                <ApricotBlossom x={75} y={170} delay={0.3} />
                <ApricotBlossom x={90} y={120} delay={0.5} />
                <ApricotBlossom x={95} y={75} delay={0.7} />
            </svg>
        </motion.div>
    );
}

function ApricotBlossom({ x, y, delay }: { x: number; y: number; delay: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.8,
                delay,
                ease: "backOut"
            }}
        >
            {/* Petals */}
            {[0, 72, 144, 216, 288].map((angle, i) => (
                <ellipse
                    key={i}
                    cx={x + Math.cos((angle * Math.PI) / 180) * 8}
                    cy={y + Math.sin((angle * Math.PI) / 180) * 8}
                    rx="6"
                    ry="10"
                    fill="#FEF3C7"
                    stroke="#F59E0B"
                    strokeWidth="0.5"
                    transform={`rotate(${angle} ${x} ${y})`}
                />
            ))}

            {/* Center */}
            <circle cx={x} cy={y} r="3" fill="#F59E0B" />

            {/* Stamens */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <line
                    key={`stamen-${i}`}
                    x1={x}
                    y1={y}
                    x2={x + Math.cos((angle * Math.PI) / 180) * 2.5}
                    y2={y + Math.sin((angle * Math.PI) / 180) * 2.5}
                    stroke="#DC2626"
                    strokeWidth="0.5"
                />
            ))}
        </motion.g>
    );
}
