'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Calendar, Save } from 'lucide-react';

interface UserProfile {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
}

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<UserProfile>) => Promise<void>;
    profile: UserProfile;
}

export default function EditProfileModal({ isOpen, onClose, onSave, profile }: EditProfileModalProps) {
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number,
        date_of_birth: profile.date_of_birth,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.first_name?.trim()) {
            newErrors.first_name = 'Vui lòng nhập họ';
        }
        if (!formData.last_name?.trim()) {
            newErrors.last_name = 'Vui lòng nhập tên';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full md:max-w-lg bg-card rounded-2xl border-2 border-tet-gold/30 shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-tet-cream rounded-full">
                                <User className="w-5 h-5 text-tet-red" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gradient-tet font-display">
                                Chỉnh Sửa Hồ Sơ
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-tet-cream rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* First Name and Last Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Họ <span className="text-tet-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.first_name ? 'border-error' : 'border-border'
                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                    placeholder="Nhập họ"
                                />
                                {errors.first_name && (
                                    <p className="text-error text-sm mt-1">{errors.first_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Tên <span className="text-tet-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.last_name ? 'border-error' : 'border-border'
                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                    placeholder="Nhập tên"
                                />
                                {errors.last_name && (
                                    <p className="text-error text-sm mt-1">{errors.last_name}</p>
                                )}
                            </div>
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-4 py-3 rounded-lg border border-border bg-tet-cream text-text-muted cursor-not-allowed"
                            />
                            <p className="text-xs text-text-muted mt-1">
                                Email không thể thay đổi
                            </p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                placeholder="0123456789"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Ngày sinh
                            </label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 rounded-full border border-border hover:bg-tet-cream transition-colors font-semibold"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn-tet-primary disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
