'use client';

import { motion } from 'framer-motion';
import { Eye, Heart, Award, Users, Clock, Shield } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen pb-16">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-tet-cream via-background to-tet-silk py-20">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-tet-red to-tet-gold flex items-center justify-center shadow-2xl"
                        >
                            <Eye className="w-12 h-12 text-white" />
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl font-display font-bold text-gradient-tet mb-6">
                            Về Chúng Tôi
                        </h1>
                        <p className="text-xl text-text-secondary leading-relaxed">
                            Mang đến vẻ đẹp và sự tự tin qua từng thiết kế kính mắt cao cấp từ Hàn Quốc
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="section-spacing">
                <div className="container">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="p-2 bg-tet-red/10 rounded-lg inline-block mb-4">
                                <Heart className="w-6 h-6 text-tet-red" />
                            </div>
                            <h2 className="text-4xl font-display font-bold text-gradient-product mb-6">
                                Câu Chuyện Của Chúng Tôi
                            </h2>
                            <div className="space-y-4 text-text-secondary leading-relaxed">
                                <p>
                                    Được thành lập với niềm đam mê về thời trang và chất lượng, chúng tôi tự hào là điểm đến tin cậy cho những ai yêu thích kính mắt cao cấp từ Hàn Quốc.
                                </p>
                                <p>
                                    Từ những ngày đầu khởi nghiệp, chúng tôi đã không ngừng nỗ lực để mang đến cho khách hàng những sản phẩm tốt nhất, kết hợp giữa phong cách hiện đại và chất lượng vượt trội.
                                </p>
                                <p>
                                    Mỗi sản phẩm được chúng tôi lựa chọn kỹ lưỡng, đảm bảo không chỉ đẹp mắt mà còn bảo vệ đôi mắt bạn một cách tối ưu nhất.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative"
                        >
                            <div className="aspect-square rounded-2xl bg-gradient-to-br from-tet-gold/20 via-tet-red/10 to-tet-cream border-2 border-tet-gold/30 shadow-2xl flex items-center justify-center">
                                <div className="text-center p-8">
                                    <Eye className="w-32 h-32 text-tet-gold/40 mx-auto mb-4" />
                                    <p className="text-2xl font-display font-bold text-gradient-gold">
                                        Tầm Nhìn & Đẳng Cấp
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Vision & Mission Section */}
            <section className="section-spacing bg-tet-cream">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-display font-bold text-gradient-tet mb-4">
                            Tầm Nhìn & Sứ Mệnh
                        </h2>
                        <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                            Chúng tôi không chỉ bán kính mắt, mà còn mang đến phong cách sống và sự tự tin
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="glass-effect rounded-2xl p-8 border-2 border-tet-gold/20 hover:border-tet-gold/40 transition-all duration-300"
                        >
                            <div className="w-16 h-16 rounded-full bg-tet-red/10 flex items-center justify-center mb-6">
                                <Eye className="w-8 h-8 text-tet-red" />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-gradient-product mb-4">
                                Tầm Nhìn
                            </h3>
                            <p className="text-text-secondary leading-relaxed">
                                Trở thành thương hiệu kính mắt Hàn Quốc hàng đầu tại Việt Nam, được tin yêu bởi chất lượng vượt trội và phong cách thời thượng.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="glass-effect rounded-2xl p-8 border-2 border-tet-gold/20 hover:border-tet-gold/40 transition-all duration-300"
                        >
                            <div className="w-16 h-16 rounded-full bg-tet-gold/10 flex items-center justify-center mb-6">
                                <Heart className="w-8 h-8 text-tet-gold" />
                            </div>
                            <h3 className="text-2xl font-display font-bold text-gradient-gold mb-4">
                                Sứ Mệnh
                            </h3>
                            <p className="text-text-secondary leading-relaxed">
                                Mang đến cho mỗi khách hàng những sản phẩm kính mắt chất lượng cao, kết hợp giữa thời trang và công nghệ, với dịch vụ tận tâm nhất.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="section-spacing">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-display font-bold text-gradient-product mb-4">
                            Tại Sao Chọn Chúng Tôi?
                        </h2>
                        <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                            Những giá trị cốt lõi làm nên sự khác biệt
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Award,
                                title: 'Chất Lượng Cao Cấp',
                                description: 'Sản phẩm chính hãng 100% từ các thương hiệu nổi tiếng Hàn Quốc, được kiểm định nghiêm ngặt.',
                                color: 'text-tet-red',
                                bg: 'bg-tet-red/10'
                            },
                            {
                                icon: Shield,
                                title: 'Chi Tiết Hoàn Hảo',
                                description: 'Mỗi sản phẩm được chế tác tỉ mỉ, chú trọng đến từng chi tiết nhỏ nhất để mang lại sự hoàn hảo.',
                                color: 'text-tet-gold',
                                bg: 'bg-tet-gold/10'
                            },
                            {
                                icon: Users,
                                title: 'Dịch Vụ Tận Tâm',
                                description: 'Đội ngũ nhân viên chuyên nghiệp, tư vấn nhiệt tình, hỗ trợ khách hàng 24/7.',
                                color: 'text-tet-red-light',
                                bg: 'bg-tet-red-light/10'
                            },
                            {
                                icon: Eye,
                                title: 'Thiết Kế Đa Dạng',
                                description: 'Bộ sưu tập phong phú từ cổ điển đến hiện đại, phù hợp với mọi phong cách và gương mặt.',
                                color: 'text-tet-gold-dark',
                                bg: 'bg-tet-gold-dark/10'
                            },
                            {
                                icon: Clock,
                                title: 'Giao Hàng Nhanh',
                                description: 'Cam kết giao hàng nhanh chóng trong 24-48h, miễn phí vận chuyển toàn quốc.',
                                color: 'text-tet-red-dark',
                                bg: 'bg-tet-red-dark/10'
                            },
                            {
                                icon: Heart,
                                title: 'Bảo Hành Uy Tín',
                                description: 'Chính sách bảo hành rõ ràng, hỗ trợ đổi trả trong 30 ngày nếu có vấn đề.',
                                color: 'text-tet-gold',
                                bg: 'bg-tet-gold/10'
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -8 }}
                                className="glass-effect rounded-2xl p-8 border-2 border-border hover:border-tet-gold/40 transition-all duration-300 group"
                            >
                                <div className={`w-16 h-16 rounded-full ${item.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                </div>
                                <h3 className="text-xl font-display font-bold text-gradient-product mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-text-secondary leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section-spacing bg-gradient-to-br from-tet-red via-tet-red-dark to-tet-red">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                            Sẵn Sàng Khám Phá?
                        </h2>
                        <p className="text-xl text-white/90 mb-8 leading-relaxed">
                            Tìm kiếm chiếc kính hoàn hảo cho phong cách của bạn ngay hôm nay
                        </p>
                        <motion.a
                            href="/products"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-block px-8 py-4 bg-white text-tet-red font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 text-lg"
                        >
                            Xem Bộ Sưu Tập
                        </motion.a>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
