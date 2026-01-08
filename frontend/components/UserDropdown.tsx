"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Lock, UserCircle, ChevronDown, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/lib/store";
import { logout } from "@/lib/api/auth";

export default function UserDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, isAuthenticated, token, clearAuth } = useAuthStore();
    const { clearWishlist } = useWishlistStore();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleLogout = async () => {
        try {
            if (token) {
                await logout(token);
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            clearAuth();
            clearWishlist(); // Clear local wishlist on logout
            setIsOpen(false);
            router.push("/");
        }
    };

    // Unauthenticated: Redirect to login
    if (!isAuthenticated) {
        return (
            <Link href="/auth/login">
                <motion.button
                    className="relative p-2 rounded-full text-foreground hover:text-tet-gold hover:bg-tet-cream transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Đăng nhập"
                >
                    <User className="w-5 h-5" />
                </motion.button>
            </Link>
        );
    }

    // Authenticated: Show dropdown
    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-full text-foreground hover:text-tet-gold hover:bg-tet-cream transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Menu tài khoản"
            >
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-tet-gold"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-tet-gold flex items-center justify-center">
                        <span className="text-sm font-bold text-tet-red-dark">
                            {user?.first_name?.[0] || user?.username?.[0] || "U"}
                        </span>
                    </div>
                )}
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 hidden md:block ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 glass-effect rounded-xl shadow-2xl border-2 border-tet-gold/20 overflow-hidden z-50"
                    >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-border bg-tet-cream/50">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {user?.full_name || user?.username}
                            </p>
                            <p className="text-xs text-text-muted truncate">{user?.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            <DropdownItem
                                icon={<UserCircle className="w-4 h-4" />}
                                label="Thông tin cá nhân"
                                href="/account/profile"
                                onClick={() => setIsOpen(false)}
                            />
                            <DropdownItem
                                icon={<ShoppingBag className="w-4 h-4" />}
                                label="Đơn hàng"
                                href="/account/orders"
                                onClick={() => setIsOpen(false)}
                            />
                            <DropdownItem
                                icon={<Lock className="w-4 h-4" />}
                                label="Đổi mật khẩu"
                                href="/account/change-password"
                                onClick={() => setIsOpen(false)}
                            />
                            <div className="border-t border-border my-2" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DropdownItem({
    icon,
    label,
    href,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    onClick: () => void;
}) {
    return (
        <Link href={href} onClick={onClick}>
            <div className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-tet-cream hover:text-tet-gold transition-colors">
                {icon}
                <span>{label}</span>
            </div>
        </Link>
    );
}
