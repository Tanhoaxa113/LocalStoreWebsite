"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { register } from "@/lib/api/auth";

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
        phone_number: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        setPasswordStrength(strength);
    };

    const handlePasswordChange = (password: string) => {
        setFormData({ ...formData, password });
        checkPasswordStrength(password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await register(formData);
            setAuth(response.user, response.token);
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const strengthColors = ["bg-error", "bg-error", "bg-warning", "bg-success", "bg-success"];
    const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tet-cream via-tet-silk to-tet-paper py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full"
            >
                <div className="glass-effect rounded-2xl shadow-2xl p-8 border-2 border-tet-gold/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.h1
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-4xl font-display font-bold text-gradient-tet mb-2"
                        >
                            Đăng Ký Tài Khoản
                        </motion.h1>
                        <p className="text-text-secondary">
                            Tham gia cùng chúng tôi!
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md"
                        >
                            <p className="text-error text-sm whitespace-pre-line">{error}</p>
                        </motion.div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-2">
                                    Họ
                                </label>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, last_name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                           focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                           transition-all duration-200 outline-none"
                                    placeholder="Nguyễn"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-2">
                                    Tên
                                </label>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, first_name: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                           focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                           transition-all duration-200 outline-none"
                                    placeholder="Văn A"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Tên đăng nhập <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                         focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                         transition-all duration-200 outline-none"
                                placeholder="username123"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Email <span className="text-error">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                         focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                         transition-all duration-200 outline-none"
                                placeholder="example@email.com"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone_number: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                         focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                         transition-all duration-200 outline-none"
                                placeholder="0912345678"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Mật khẩu <span className="text-error">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                           focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                           transition-all duration-200 outline-none"
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-tet-gold transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-border"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-text-muted">
                                        Độ mạnh: {strengthLabels[passwordStrength - 1] || "Rất yếu"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Xác nhận mật khẩu <span className="text-error">*</span>
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password_confirm}
                                onChange={(e) =>
                                    setFormData({ ...formData, password_confirm: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                         focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                         transition-all duration-200 outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isLoading}
                            disabled={isLoading}
                            className="w-full"
                        >
                            Đăng Ký
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

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-text-secondary">
                            Đã có tài khoản?{" "}
                            <Link
                                href="/auth/login"
                                className="font-semibold text-tet-gold hover:text-tet-gold-dark transition-colors"
                            >
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Tet Decoration */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-6 text-tet-gold"
                >
                    <p className="text-sm">Chúc mừng năm mới - An khang thịnh vượng</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
