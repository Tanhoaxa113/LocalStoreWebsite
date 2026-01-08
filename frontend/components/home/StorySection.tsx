"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function StorySection() {
    return (
        <section className="py-28 relative overflow-hidden">
            {/* Background Decor removed for unified background */}

            <div className="container mx-auto px-4 md:px-6 relative z-10">

                {/* Content - Centered Top */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl mx-auto text-center mb-16"
                >
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gradient-tet leading-tight mb-6">
                        Chất Lượng Hàn Quốc & Tinh Thần Việt Nam
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Chúng tôi mang đến những mẫu kính mắt thời thượng nhất từ Seoul,
                        <br />
                        được tuyển chọn kỹ lưỡng để phù hợp với khuôn mặt và gu thẩm mỹ của người Việt.
                    </p>
                </motion.div>




            </div>

            {/* Image Grid - Centered Bottom */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative max-w-4xl mx-auto"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="space-y-4 translate-y-8 md:translate-y-12">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-2 border-tet-gold/20 transform rotate-[-2deg] hover:rotate-0 transition-all duration-500">
                            <div className="absolute inset-0 bg-tet-silk flex items-center justify-center">
                                <span className="text-tet-gold font-display font-bold text-xl">K-Style</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-tet-red/20 transform rotate-[2deg] hover:rotate-0 transition-all duration-500">
                            <div className="absolute inset-0 bg-tet-red/10 flex items-center justify-center">
                                <span className="text-tet-red font-display font-bold text-xl">Fashion</span>
                            </div>
                        </div>
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-2 border-tet-gold/20 transform rotate-[3deg] hover:rotate-0 transition-all duration-500">
                            <div className="absolute inset-0 bg-tet-gold/10 flex items-center justify-center">
                                <span className="text-tet-gold-dark font-display font-bold text-xl">Quality</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 md:translate-y-8">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-2 border-tet-red/20 transform rotate-[-3deg] hover:rotate-0 transition-all duration-500">
                            <div className="absolute inset-0 bg-background flex items-center justify-center">
                                <span className="text-tet-red-dark font-display font-bold text-xl">Trend</span>
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-tet-gold/20 transform rotate-[2deg] hover:rotate-0 transition-all duration-500">
                            <div className="absolute inset-0 bg-tet-silk flex items-center justify-center">
                                <span className="text-tet-gold font-display font-bold text-xl">Seoul</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-2 border-tet-red/20 transform rotate-[3deg] hover:rotate-0 transition-all duration-500">
                            <div className="absolute inset-0 bg-tet-red/5 flex items-center justify-center">
                                <span className="text-tet-red font-display font-bold text-xl">2026</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Central Badge - Positioned Absolute Center of Grid */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-full shadow-xl animate-spin-slow z-10 hidden md:block" style={{ animationDuration: '20s' }}>
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-tet-gold flex items-center justify-center text-center">
                        <span className="text-xs font-bold text-tet-red">EST <br /> 2024</span>
                    </div>
                </div>
            </motion.div>

            <div className="pt-16 text-center">
                <Link href="/about" className="inline-flex items-center gap-2 text-tet-red font-bold hover:gap-4 transition-all text-lg">
                    Tìm hiểu thêm về câu chuyện
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </section>
    );
}
