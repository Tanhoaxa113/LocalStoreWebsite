"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Button from "@/components/Button";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setIsLoading(true);

        try {
            await forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
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
                            🔑
                        </motion.div>
                        <h1 className="text-3xl font-display font-bold text-gradient-tet mb-2">
                            Quên Mật Khẩu?
                        </h1>
                        <p className="text-text-secondary">
                            Đừng lo lắng! Chúng tôi sẽ giúp bạn lấy lại tài khoản.
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
                                <div className="text-5xl mb-4">✅</div>
                                <h2 className="text-xl font-bold text-success mb-2">
                                    Email đã được gửi!
                                </h2>
                                <p className="text-text-secondary">
                                    Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
                                </p>
                            </div>

                            <div className="p-4 bg-tet-silk rounded-lg border border-tet-gold/20">
                                <p className="text-sm text-text-muted">
                                    💡 <strong>Mẹo:</strong> Nếu không thấy email, hãy kiểm tra thư mục spam hoặc rác.
                                </p>
                            </div>

                            <Link
                                href="/auth/login"
                                className="inline-block w-full btn-tet-primary text-center"
                            >
                                Quay lại đăng nhập
                            </Link>
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
                                    <p className="text-error text-sm">{error}</p>
                                </motion.div>
                            )}

                            {/* Forgot Password Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-semibold text-text-primary mb-2"
                                    >
                                        Địa chỉ Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                             focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                             transition-all duration-200 outline-none
                             text-text-primary placeholder:text-text-muted"
                                        placeholder="example@email.com"
                                    />
                                    <p className="mt-2 text-xs text-text-muted">
                                        Nhập email bạn đã sử dụng để đăng ký tài khoản.
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={isLoading}
                                    disabled={isLoading}
                                    className="w-full"
                                    icon={<span>📧</span>}
                                >
                                    Gửi email đặt lại
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
