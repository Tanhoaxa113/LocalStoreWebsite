"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { resetPassword } from "@/lib/api/auth";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        newPassword: "",
        newPasswordConfirm: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [uid, setUid] = useState("");
    const [token, setToken] = useState("");

    useEffect(() => {
        const uidParam = searchParams.get("uid");
        const tokenParam = searchParams.get("token");

        if (!uidParam || !tokenParam) {
            setError("Liên kết đặt lại mật khẩu không hợp lệ.");
        } else {
            setUid(uidParam);
            setToken(tokenParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (formData.newPassword !== formData.newPasswordConfirm) {
            setError("Mật khẩu xác nhận không khớp.");
            setIsLoading(false);
            return;
        }

        try {
            await resetPassword(uid, token, formData.newPassword, formData.newPasswordConfirm);
            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/auth/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
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
                <div className="glass-effect rounded-2xl shadow-2xl p-8 border-2 border-tet-gold/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="text-6xl mb-4"
                        >
                        </motion.div>
                        <h1 className="text-3xl font-display font-bold text-gradient-tet mb-2">
                            Đặt Lại Mật Khẩu
                        </h1>
                        <p className="text-text-secondary">
                            Tạo mật khẩu mới cho tài khoản của bạn
                        </p>
                    </div>

                    {/* Success Message */}
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="p-6 bg-success/10 border-2 border-success rounded-lg">
                                <div className="text-5xl mb-4"></div>
                                <h2 className="text-xl font-bold text-success mb-2">
                                    Đặt lại mật khẩu thành công!
                                </h2>
                                <p className="text-text-secondary">
                                    Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng đến trang đăng nhập...
                                </p>
                            </div>

                            <div className="animate-pulse text-tet-gold">
                                <span className="text-2xl">⏳</span>
                            </div>
                        </motion.div>
                    ) : (
                        <>
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

                            {/* Reset Password Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* New Password */}
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="block text-sm font-semibold text-text-primary mb-2"
                                    >
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.newPassword}
                                            onChange={(e) =>
                                                setFormData({ ...formData, newPassword: e.target.value })
                                            }
                                            className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                               focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                               transition-all duration-200 outline-none
                               text-text-primary placeholder:text-text-muted"
                                            placeholder="••••••••"
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-tet-gold transition-colors"
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-text-muted">
                                        Mật khẩu phải có ít nhất 8 ký tự
                                    </p>
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label
                                        htmlFor="newPasswordConfirm"
                                        className="block text-sm font-semibold text-text-primary mb-2"
                                    >
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <input
                                        id="newPasswordConfirm"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.newPasswordConfirm}
                                        onChange={(e) =>
                                            setFormData({ ...formData, newPasswordConfirm: e.target.value })
                                        }
                                        className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                             focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                             transition-all duration-200 outline-none
                             text-text-primary placeholder:text-text-muted"
                                        placeholder="••••••••"
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={isLoading}
                                    disabled={isLoading || !uid || !token}
                                    className="w-full"
                                    icon={<span>🔐</span>}
                                >
                                    Đặt lại mật khẩu
                                </Button>
                            </form>

                            {/* Back to Login */}
                            <div className="mt-6 text-center">
                                <Link
                                    href="/auth/login"
                                    className="text-sm text-tet-gold hover:text-tet-gold-dark transition-colors font-semibold"
                                >
                                    ← Quay lại đăng nhập
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Tet Decoration */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-6 text-tet-gold"
                >
                    <p className="text-sm">🧧 Chúc mừng năm mới - An khang thịnh vượng 🧧</p>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
