"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Menu, X, Heart, Sparkles } from "lucide-react";
import { useCartStore, useUIStore, useWishlistStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import UserDropdown from "./UserDropdown";
import ThemeToggle from "./ThemeToggle";

export default function Navigation() {
    const [scrolled, setScrolled] = useState(false);
    const cart = useCartStore((state) => state.cart);
    const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
    const { isSearchOpen, toggleSearch } = useUIStore();
    const { effectsEnabled, toggleEffects } = useUIStore();
    const wishlistItems = useWishlistStore((state) => state.items);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const cartItemCount = cart?.total_items || 0;
    const wishlistCount = wishlistItems.length;

    return (
        <>
            <motion.header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    scrolled
                        ? "glass-effect shadow-lg"
                        : "bg-transparent"
                )}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2 group">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-gradient-tet">
                                    Mắt Kính Hàn Quốc Cần Thơ
                                </h1>
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-tet-gold group-hover:w-full transition-all duration-300" />
                            </motion.div>
                        </Link>

                        {/* Desktop Navigation - Vietnamese */}
                        <nav className="hidden md:flex items-center justify-center space-x-8">
                            <NavLink href="/products">Tất cả sản phẩm</NavLink>
                            <NavLink href="/products?is_new_arrival=true">Hàng mới về</NavLink>
                            <NavLink href="/products?is_best_seller=true">Bán chạy nhất</NavLink>
                            <NavLink href="/about">Về chúng tôi</NavLink>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                            {/* Search */}
                            <IconButton
                                icon={<Search className="w-5 h-5" />}
                                onClick={toggleSearch}
                                label="Tìm kiếm"
                            />

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Effects Toggle */}
                            <IconButton
                                icon={<Sparkles className="w-5 h-5" />}
                                onClick={toggleEffects}
                                label={effectsEnabled ? "Tắt hiệu ứng" : "Bật hiệu ứng"}
                                highlight={effectsEnabled}
                            />

                            {/* Wishlist */}
                            <Link href="/wishlist">
                                <IconButton
                                    icon={<Heart className="w-5 h-5" />}
                                    badge={wishlistCount}
                                    label="Yêu thích"
                                />
                            </Link>

                            {/* Cart - Lucky Envelope Style */}
                            <Link href="/cart">
                                <IconButton
                                    icon={<ShoppingCart className="w-5 h-5" />}
                                    badge={cartItemCount}
                                    label="Giỏ hàng"
                                    highlight
                                />
                            </Link>

                            {/* User Dropdown */}
                            <div className="hidden md:block">
                                <UserDropdown />
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={toggleMobileMenu}
                                className="md:hidden p-2 text-foreground hover:text-tet-gold transition-colors"
                                aria-label="Mở menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu - Vietnamese */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="md:hidden glass-effect border-t border-border"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <nav className="container mx-auto px-4 py-6 space-y-4">
                                <MobileNavLink href="/products" onClick={closeMobileMenu}>
                                    Tất cả sản phẩm
                                </MobileNavLink>
                                <MobileNavLink href="/products?is_new_arrival=true" onClick={closeMobileMenu}>
                                    Hàng mới về
                                </MobileNavLink>
                                <MobileNavLink href="/products?is_best_seller=true" onClick={closeMobileMenu}>
                                    Bán chạy nhất
                                </MobileNavLink>
                                <MobileNavLink href="/about" onClick={closeMobileMenu}>
                                    Về chúng tôi
                                </MobileNavLink>

                                {/* User Dropdown for Mobile */}
                                <div className="pt-4 border-t border-border">
                                    <UserDropdown />
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* Search Modal - Vietnamese */}
            <AnimatePresence>
                {isSearchOpen && <SearchModal />}
            </AnimatePresence>
        </>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="relative text-foreground hover:text-tet-gold transition-colors font-medium group"
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-tet-gold group-hover:w-full transition-all duration-300" />
        </Link>
    );
}

function MobileNavLink({
    href,
    children,
    onClick,
}: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="block text-lg font-medium text-foreground hover:text-tet-gold transition-colors"
        >
            {children}
        </Link>
    );
}

function IconButton({
    icon,
    badge,
    onClick,
    label,
    highlight,
}: {
    icon: React.ReactNode;
    badge?: number;
    onClick?: () => void;
    label: string;
    highlight?: boolean;
}) {
    return (
        <motion.button
            onClick={onClick}
            className={cn(
                "relative p-2 rounded-full transition-all duration-200",
                highlight
                    ? "lucky-envelope text-white shadow-md hover:shadow-lg"
                    : "text-foreground hover:text-tet-gold hover:bg-tet-cream"
            )}
            style={{ overflow: 'visible' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={label}
        >
            {icon}
            {badge !== undefined && badge > 0 && (
                <motion.span
                    className="absolute -top-2 -right-2 bg-tet-red text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center border-2 border-background shadow-sm"
                    style={{ zIndex: 50 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                    {badge > 99 ? "99+" : badge}
                </motion.span>
            )}
        </motion.button>
    );
}

function SearchModal() {
    const { closeSearch } = useUIStore();
    const [query, setQuery] = useState("");

    const handleSearch = () => {
        if (query.trim()) {
            closeSearch();
            window.location.href = `/products?search=${encodeURIComponent(query.trim())}`;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
        >
            <motion.div
                className="absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-full sm:max-w-md md:max-w-2xl mx-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="glass-effect rounded-2xl p-6 shadow-2xl border-2 border-tet-gold/20">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tet-gold" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-12 pr-4 py-4 bg-background text-foreground border-2 border-tet-gold/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-tet-gold focus:border-transparent placeholder:text-muted-foreground"
                            autoFocus
                        />
                    </div>
                    {query && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            Nhấn Enter để tìm kiếm "{query}"
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
