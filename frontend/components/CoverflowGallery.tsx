"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const customerImages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function CoverflowGallery() {
    const [currentIndex, setCurrentIndex] = useState(5);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % customerImages.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + customerImages.length) % customerImages.length);
    };

    const getPosition = (index: number) => {
        const diff = index - currentIndex;
        if (diff === 0) return "center";
        if (diff === -1 || (diff === customerImages.length - 1)) return "left-1";
        if (diff === 1 || (diff === -(customerImages.length - 1))) return "right-1";
        if (diff === -2 || (diff === customerImages.length - 2)) return "left-2";
        if (diff === 2 || (diff === -(customerImages.length - 2))) return "right-2";
        return "hidden";
    };

    const getTransform = (position: string) => {
        switch (position) {
            case "center":
                return {
                    x: "0%",
                    scale: 1,
                    zIndex: 5,
                    opacity: 1,
                    rotateY: 0
                };
            case "left-1":
                return {
                    x: "-70%",
                    scale: 0.85,
                    zIndex: 4,
                    opacity: 0.7,
                    rotateY: 25
                };
            case "right-1":
                return {
                    x: "70%",
                    scale: 0.85,
                    zIndex: 4,
                    opacity: 0.7,
                    rotateY: -25
                };
            case "left-2":
                return {
                    x: "-140%",
                    scale: 0.7,
                    zIndex: 3,
                    opacity: 0.4,
                    rotateY: 35
                };
            case "right-2":
                return {
                    x: "140%",
                    scale: 0.7,
                    zIndex: 3,
                    opacity: 0.4,
                    rotateY: -35
                };
            default:
                return {
                    x: "0%",
                    scale: 0.5,
                    zIndex: 1,
                    opacity: 0,
                    rotateY: 0
                };
        }
    };

    return (
        <section className="py-28 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="container mx-auto px-4 text-center mb-16"
            >
                <h2 className="h-14 text-4xl md:text-5xl font-display font-bold mb-3 text-gradient-tet">Khách Hàng Thân Thiết</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Hàng ngàn khách hàng đã tin tưởng và lựa chọn Kính Mắt Hàn Quốc cho phong cách của mình.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative h-[300px] sm:h-[350px] md:h-[400px] flex items-center justify-center perspective-1000"
            >
                <div className="relative w-full max-w-sm h-full flex items-center justify-center">
                    {customerImages.map((item, index) => {
                        const position = getPosition(index);
                        const transform = getTransform(position);

                        return (
                            <motion.div
                                key={item}
                                initial={false}
                                animate={{
                                    x: transform.x,
                                    scale: transform.scale,
                                    opacity: transform.opacity,
                                    rotateY: transform.rotateY,
                                    zIndex: transform.zIndex,
                                }}
                                transition={{
                                    duration: 0.5,
                                    ease: "easeInOut"
                                }}
                                className="absolute w-full h-full max-w-sm"
                                style={{
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                <div
                                    className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300"
                                    style={{
                                        transform: `rotateY(${transform.rotateY}deg)`,
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-tet-silk via-tet-cream to-tet-gold/20 flex items-center justify-center">
                                        <div className="text-center p-8">
                                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-background/50 flex items-center justify-center">
                                                <svg className="w-12 h-12 text-tet-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm sm:text-base text-text-secondary font-medium">Khách hàng {item}</p>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 p-2 text-tet-red dark:text-tet-gold hover:text-tet-red-dark dark:hover:text-tet-gold-light transition-colors z-10"
                    aria-label="Previous"
                >
                    <ChevronLeft className="w-10 h-10" />
                </button>

                <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 p-2 text-tet-red dark:text-tet-gold hover:text-tet-red-dark dark:hover:text-tet-gold-light transition-colors z-10"
                    aria-label="Next"
                >
                    <ChevronRight className="w-10 h-10" />
                </button>
            </motion.div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
                {customerImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                            ? "bg-tet-red w-8"
                            : "bg-tet-gold/50 hover:bg-tet-gold"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
