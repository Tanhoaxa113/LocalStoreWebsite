"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Button from "../Button";

export default function HeroSection() {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (custom: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut",
                delay: custom * 0.1
            }
        })
    };

    return (
        <section className="relative w-full min-h-[95vh] flex items-center justify-center overflow-hidden">
            {/* Background Decor - Semantic: aria-hidden since it's decorative - Removed for unified background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center pt-32 md:pt-40">

                <h1
                    className="text-5xl md:text-6xl lg:text-8xl font-display font-bold leading-tight mb-10 tracking-tight text-gradient-tet"
                >
                    Mắt Kính Hàn Quốc Cần Thơ
                </h1>

                <motion.p
                    custom={2}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.3 }}
                    variants={fadeUpVariants}
                    className="text-lg md:text-2xl text-black/60 dark:text-white/70 max-w-3xl mx-auto mb-14 leading-relaxed tracking-wide font-sans"
                >
                    Thần Thái Ngút Ngàn - Đón Tết Sang Trang
                    <br />
                    Khởi đầu năm mới với phong cách Hàn Quốc thời thượng.
                </motion.p>

                <motion.div
                    custom={3}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.3 }}
                    variants={fadeUpVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto"
                >
                    <Link href="/products" className="w-full sm:w-auto">
                        <Button
                            className="btn-tet-primary w-full sm:w-auto min-w-[200px]"
                            icon={<ArrowRight className="w-4 h-4" />}
                        >
                            Săn Sale Đón Tết
                        </Button>
                    </Link>
                    <Link href="/products?is_new_arrival=true" className="w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            className="w-full sm:w-auto min-w-[200px] shadow-lg shadow-tet-gold/20"
                        >
                            Bộ Sưu Tập Mới
                        </Button>
                    </Link>
                </motion.div>

                <motion.div
                    custom={4}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: false, amount: 0.3 }}
                    variants={fadeUpVariants}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-16 mt-20 text-base text-foreground/80 font-medium"
                >
                    <div className="flex items-center justify-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-tet-gold ring-4 ring-tet-gold/20" />
                        Chất lượng cao cấp
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-tet-gold ring-4 ring-tet-gold/20" />
                        Thiết kế Hàn Quốc
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-tet-gold ring-4 ring-tet-gold/20" />
                        Miễn phí vận chuyển
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
