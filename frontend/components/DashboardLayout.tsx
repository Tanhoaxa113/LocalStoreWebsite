'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, ShoppingBag, Heart, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const menuItems = [
    {
        href: '/account/profile',
        label: 'Hồ Sơ',
        icon: User,
    },
    {
        href: '/account/addresses',
        label: 'Địa Chỉ',
        icon: MapPin,
    },
    {
        href: '/account/orders',
        label: 'Đơn Hàng',
        icon: ShoppingBag,
    },
    {
        href: '/wishlist',
        label: 'Yêu Thích',
        icon: Heart,
    },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-tet-cream py-6 sm:py-8 md:py-12">
            <div className="container">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Responsive */}
                    <aside className="lg:col-span-1 mb-6 lg:mb-0">
                        {/* Mobile: Horizontal Scroll Menu */}
                        <div className="lg:hidden mb-6">
                            <div className="overflow-x-auto">
                                <nav className="flex gap-2 pb-2">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className="flex-shrink-0"
                                            >
                                                <div
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${isActive
                                                        ? 'bg-tet-red text-white'
                                                        : 'bg-card text-foreground hover:bg-tet-cream hover:text-tet-red'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Desktop: Sidebar */}
                        <div className="hidden lg:block bg-card rounded-2xl border border-border shadow-md p-4 md:p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gradient-tet mb-6 font-display">
                                Tài Khoản Của Tôi
                            </h2>

                            <nav className="space-y-2">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="block"
                                        >
                                            <motion.div
                                                whileHover={{ x: 4 }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                    ? 'bg-tet-red text-white'
                                                    : 'text-foreground hover:bg-tet-cream hover:text-tet-red'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium">{item.label}</span>
                                            </motion.div>
                                        </Link>
                                    );
                                })}

                                <button
                                    onClick={() => {
                                        // Handle logout
                                        localStorage.removeItem('auth_token');
                                        window.location.href = '/';
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-red-50 hover:text-red-600 transition-colors mt-4"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Đăng Xuất</span>
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>
            </div>
        </div>
    );
}
