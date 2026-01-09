"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    // SEO: JSON-LD structured data for LocalBusiness
    const localBusinessJsonLd = {
        "@context": "https://schema.org",
        "@type": "Optician",
        name: "Mắt Kính Hàn Quốc Cần Thơ",
        image: "https://matkinhhanquoc.com/logo.png", // Replace with actual logo URL
        "@id": "#localbusiness",
        url: "https://matkinhhanquoc.com",
        telephone: "+84123456789",
        priceRange: "$$",
        address: {
            "@type": "PostalAddress",
            streetAddress: "Đường 3/2, Quận Ninh Kiều", // Update with actual address
            addressLocality: "Cần Thơ",
            postalCode: "90000",
            addressCountry: "VN"
        },
        geo: {
            "@type": "GeoCoordinates",
            latitude: 10.0452, // Approximate coords for Can Tho
            longitude: 105.7469
        },
        openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            opens: "08:00",
            closes: "22:00"
        },
        sameAs: [
            "https://facebook.com",
            "https://instagram.com"
        ]
    };

    return (
        <footer className="relative mt-20 border-t border-tet-gold/20" role="contentinfo">
            {/* SEO: JSON-LD structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
            />

            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-tet-gold to-transparent opacity-50" />

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-display font-bold text-gradient-tet">
                            Mắt Kính Hàn Quốc Cần Thơ
                        </h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            Mang đến cho bạn bộ sưu tập kính mắt Hàn Quốc cao cấp với phong cách thanh lịch và chất lượng tuyệt vời.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-tet-gold/10 hover:bg-tet-gold/20 text-tet-gold transition-colors"
                                aria-label="Theo dõi Facebook của Mắt Kính Hàn Quốc Cần Thơ"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-tet-gold/10 hover:bg-tet-gold/20 text-tet-gold transition-colors"
                                aria-label="Theo dõi Instagram của Mắt Kính Hàn Quốc Cần Thơ"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="font-display font-semibold text-gradient-tet">
                            Liên Kết Nhanh
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/products"
                                    className="text-text-secondary hover:text-tet-gold transition-colors text-sm"
                                >
                                    Sản Phẩm
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/cart"
                                    className="text-text-secondary hover:text-tet-gold transition-colors text-sm"
                                >
                                    Giỏ Hàng
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/wishlist"
                                    className="text-text-secondary hover:text-tet-gold transition-colors text-sm"
                                >
                                    Yêu Thích
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/account/profile"
                                    className="text-text-secondary hover:text-tet-gold transition-colors text-sm"
                                >
                                    Tài Khoản
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Support */}
                    <div className="space-y-4">
                        <h4 className="font-display font-semibold text-gradient-tet">
                            Hỗ Trợ Khách Hàng
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-text-secondary hover:text-tet-gold transition-colors text-sm"
                                >
                                    Về Chúng Tôi
                                </Link>
                            </li>
                            <li className="text-text-secondary hover:text-tet-gold transition-colors text-sm">
                                Liên Hệ
                            </li>
                            <li className="text-text-secondary hover:text-tet-gold transition-colors text-sm">
                                Chính Sách Giao Hàng
                            </li>
                            <li className="text-text-secondary hover:text-tet-gold transition-colors text-sm">
                                Chính Sách Đổi Trả
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="font-display font-semibold text-gradient-tet">
                            Liên Hệ
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-text-secondary">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-tet-gold" />
                                <a
                                    href="https://maps.app.goo.gl/bjtAdrYMwoUUHsBYA"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-tet-gold transition-colors"
                                >
                                    Mắt Kính Hàn Quốc Cần Thơ
                                </a>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-text-secondary">
                                <Phone className="w-4 h-4 flex-shrink-0 text-tet-gold" />
                                <a href="tel:+84123456789" className="hover:text-tet-gold transition-colors">
                                    +84 123 456 789
                                </a>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-text-secondary">
                                <Mail className="w-4 h-4 flex-shrink-0 text-tet-gold" />
                                <a href="mailto:chinguyen23724@gmail.com" className="hover:text-tet-gold transition-colors">
                                    chinguyen23724@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-tet-gold/20">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted">
                        <p>
                            © {currentYear} Kính Mắt Hàn Quốc. Tất cả quyền được bảo lưu.
                        </p>
                        <div className="flex gap-6">
                            <Link href="/privacy" className="hover:text-tet-gold transition-colors">
                                Chính Sách Riêng Tư
                            </Link>
                            <Link href="/terms" className="hover:text-tet-gold transition-colors">
                                Điều Khoản Sử Dụng
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Apricot Blossom Pattern */}
            <div className="absolute bottom-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full text-tet-gold">
                    <circle cx="100" cy="100" r="5" fill="currentColor" />
                    <circle cx="100" cy="60" r="15" fill="currentColor" opacity="0.6" />
                    <circle cx="140" cy="100" r="15" fill="currentColor" opacity="0.6" />
                    <circle cx="100" cy="140" r="15" fill="currentColor" opacity="0.6" />
                    <circle cx="60" cy="100" r="15" fill="currentColor" opacity="0.6" />
                    <circle cx="75" cy="75" r="15" fill="currentColor" opacity="0.6" />
                </svg>
            </div>
        </footer>
    );
}
