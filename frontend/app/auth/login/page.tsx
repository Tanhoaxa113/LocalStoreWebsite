"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/lib/store";
import { login } from "@/lib/api/auth";
import { wishlistAPI } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const { clearWishlist, addItem } = useWishlistStore();

    const [formData, setFormData] = useState({
        username: "", // Can be email or username
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await login(formData);
            setAuth(response.user, response.token);

            // Sync wishlist from backend after login
            try {
                const { data } = await wishlistAPI.getWishlist();
                clearWishlist(); // Clear local store first
                // Populate with backend wishlist
                data.items.forEach(item => addItem(item.product.id));
            } catch (wishlistError) {
                console.error("Failed to sync wishlist:", wishlistError);
                // Don't block login if wishlist sync fails
            }

            router.push("/");
        } catch (err: any) {
            setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tet-cream via-tet-silk to-tet-paper py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                {/* Card Container */}
                <div className="glass-effect rounded-2xl shadow-2xl p-8 border-2 border-tet-gold/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-4xl font-display font-bold text-gradient-tet mb-2"
                        >
                            Đăng Nhập
                        </motion.h1>
                        <p className="text-text-secondary">
                            Chào mừng trở lại!
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md"
                        >
                            <p className="text-error text-sm">{error}</p>
                        </motion.div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email/Username Input */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-semibold text-text-primary mb-2"
                            >
                                Email hoặc Tên đăng nhập
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                         focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                         transition-all duration-200 outline-none
                         text-text-primary placeholder:text-text-muted"
                                placeholder="example@email.com hoặc username"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-text-primary mb-2"
                            >
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                           focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                           transition-all duration-200 outline-none
                           text-text-primary placeholder:text-text-muted"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-tet-gold transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-border text-tet-red focus:ring-tet-gold"
                                />
                                <label
                                    htmlFor="remember-me"
                                    className="ml-2 text-sm text-text-secondary"
                                >
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm font-semibold text-tet-red hover:text-tet-red-dark transition-colors"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isLoading}
                            disabled={isLoading}
                            className="w-full"
                        >
                            Đăng Nhập
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-background text-text-muted">
                                Hoặc
                            </span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-text-secondary">
                            Chưa có tài khoản?{" "}
                            <Link
                                href="/auth/register"
                                className="font-semibold text-tet-gold hover:text-tet-gold-dark transition-colors"
                            >
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
