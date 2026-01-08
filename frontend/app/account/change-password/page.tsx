'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Button from "@/components/ui/Button";
import { api } from '@/lib/api';

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
    { label: 'Ít nhất 8 ký tự', test: (p) => p.length >= 8 },
    { label: 'Chứa chữ hoa', test: (p) => /[A-Z]/.test(p) },
    { label: 'Chứa chữ thường', test: (p) => /[a-z]/.test(p) },
    { label: 'Chứa số', test: (p) => /[0-9]/.test(p) },
];

export default function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (formData.new_password !== formData.confirm_password) {
            setError('Mật khẩu mới không khớp');
            return;
        }

        // Check password requirements
        const failedRequirements = passwordRequirements.filter(
            req => !req.test(formData.new_password)
        );
        if (failedRequirements.length > 0) {
            setError('Mật khẩu mới không đáp ứng yêu cầu bảo mật');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/profile/change_password/', {
                current_password: formData.current_password,
                new_password: formData.new_password,
            });
            setSuccess('Đổi mật khẩu thành công!');
            setFormData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.current_password?.[0] ||
                err.response?.data?.new_password?.[0] ||
                'Đổi mật khẩu thất bại. Vui lòng thử lại.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    return (
        <DashboardLayout>
            <div className="bg-card rounded-2xl border border-border shadow-md p-4 sm:p-6 md:p-8 max-w-full md:max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-tet-cream rounded-full">
                        <Lock className="w-6 h-6 text-tet-red" />
                    </div>
                    <h1 className="text-2xl font-bold text-gradient-tet font-display">
                        Đổi Mật Khẩu
                    </h1>
                </div>

                {/* Success Message */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-success/10 border-l-4 border-success rounded-md"
                    >
                        <p className="text-success text-sm font-medium">{success}</p>
                    </motion.div>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-md"
                    >
                        <p className="text-error text-sm font-medium">{error}</p>
                    </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div>
                        <label
                            htmlFor="current_password"
                            className="block text-sm font-semibold text-text-primary mb-2"
                        >
                            Mật khẩu hiện tại
                        </label>
                        <div className="relative">
                            <input
                                id="current_password"
                                type={showPasswords.current ? 'text' : 'password'}
                                required
                                value={formData.current_password}
                                onChange={(e) =>
                                    setFormData({ ...formData, current_password: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                                    focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                                    transition-all duration-200 outline-none
                                    text-text-primary placeholder:text-text-muted pr-12"
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowPassword('current')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-tet-gold transition-colors"
                            >
                                {showPasswords.current ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label
                            htmlFor="new_password"
                            className="block text-sm font-semibold text-text-primary mb-2"
                        >
                            Mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                id="new_password"
                                type={showPasswords.new ? 'text' : 'password'}
                                required
                                value={formData.new_password}
                                onChange={(e) =>
                                    setFormData({ ...formData, new_password: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                                    focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                                    transition-all duration-200 outline-none
                                    text-text-primary placeholder:text-text-muted pr-12"
                                placeholder="Nhập mật khẩu mới"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowPassword('new')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-tet-gold transition-colors"
                            >
                                {showPasswords.new ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Password Requirements */}
                        <div className="mt-3 space-y-2">
                            {passwordRequirements.map((req, index) => {
                                const isValid = req.test(formData.new_password);
                                return (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        {isValid ? (
                                            <Check className="w-4 h-4 text-success" />
                                        ) : (
                                            <X className="w-4 h-4 text-text-muted" />
                                        )}
                                        <span
                                            className={
                                                isValid
                                                    ? 'text-success'
                                                    : 'text-text-muted'
                                            }
                                        >
                                            {req.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label
                            htmlFor="confirm_password"
                            className="block text-sm font-semibold text-text-primary mb-2"
                        >
                            Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                            <input
                                id="confirm_password"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                required
                                value={formData.confirm_password}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirm_password: e.target.value })
                                }
                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background
                                    focus:border-tet-gold focus:ring-2 focus:ring-tet-gold/20
                                    transition-all duration-200 outline-none
                                    text-text-primary placeholder:text-text-muted pr-12"
                                placeholder="Nhập lại mật khẩu mới"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShowPassword('confirm')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-tet-gold transition-colors"
                            >
                                {showPasswords.confirm ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        {formData.confirm_password && formData.new_password !== formData.confirm_password && (
                            <p className="mt-2 text-sm text-error">
                                Mật khẩu không khớp
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isLoading}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Đổi mật khẩu
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
