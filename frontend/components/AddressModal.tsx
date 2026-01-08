'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { UserAddress } from '@/lib/api';

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<UserAddress>) => Promise<void>;
    address?: UserAddress | null;
    title: string;
}

export default function AddressModal({ isOpen, onClose, onSave, address, title }: AddressModalProps) {
    const [formData, setFormData] = useState<Partial<UserAddress>>({
        label: address?.label || '',
        recipient_name: address?.recipient_name || '',
        recipient_phone: address?.recipient_phone || '',
        address_line1: address?.address_line1 || '',
        address_line2: address?.address_line2 || '',
        ward: address?.ward || '',
        district: address?.district || '',
        city: address?.city || '',
        postal_code: address?.postal_code || '',
        country: address?.country || 'Vietnam',
        is_default: address?.is_default || false,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.label?.trim()) {
            newErrors.label = 'Vui lòng nhập nhãn địa chỉ';
        }
        if (!formData.recipient_name?.trim()) {
            newErrors.recipient_name = 'Vui lòng nhập tên người nhận';
        }
        if (!formData.recipient_phone?.trim()) {
            newErrors.recipient_phone = 'Vui lòng nhập số điện thoại';
        }
        if (!formData.address_line1?.trim()) {
            newErrors.address_line1 = 'Vui lòng nhập địa chỉ';
        }
        if (!formData.city?.trim()) {
            newErrors.city = 'Vui lòng nhập thành phố';
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
            console.error('Error saving address:', error);
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
                    className="relative w-full md:max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border-2 border-tet-gold/30 shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-tet-cream rounded-full">
                                <MapPin className="w-5 h-5 text-tet-red" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gradient-tet font-display">
                                {title}
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
                        {/* Label */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Nhãn địa chỉ <span className="text-tet-red">*</span>
                            </label>
                            <input
                                type="text"
                                name="label"
                                value={formData.label}
                                onChange={handleChange}
                                placeholder="Ví dụ: Nhà riêng, Văn phòng, Nhà bố mẹ"
                                className={`w-full px-4 py-3 rounded-lg border ${errors.label ? 'border-error' : 'border-border'
                                    } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                            />
                            {errors.label && (
                                <p className="text-error text-sm mt-1">{errors.label}</p>
                            )}
                        </div>

                        {/* Recipient Name and Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Tên người nhận <span className="text-tet-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="recipient_name"
                                    value={formData.recipient_name}
                                    onChange={handleChange}
                                    placeholder="Nguyễn Văn A"
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.recipient_name ? 'border-error' : 'border-border'
                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                />
                                {errors.recipient_name && (
                                    <p className="text-error text-sm mt-1">{errors.recipient_name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Số điện thoại <span className="text-tet-red">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="recipient_phone"
                                    value={formData.recipient_phone}
                                    onChange={handleChange}
                                    placeholder="0909123456"
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.recipient_phone ? 'border-error' : 'border-border'
                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                />
                                {errors.recipient_phone && (
                                    <p className="text-error text-sm mt-1">{errors.recipient_phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Address Line 1 */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Địa chỉ <span className="text-tet-red">*</span>
                            </label>
                            <input
                                type="text"
                                name="address_line1"
                                value={formData.address_line1}
                                onChange={handleChange}
                                placeholder="123 Lê Lợi"
                                className={`w-full px-4 py-3 rounded-lg border ${errors.address_line1 ? 'border-error' : 'border-border'
                                    } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                            />
                            {errors.address_line1 && (
                                <p className="text-error text-sm mt-1">{errors.address_line1}</p>
                            )}
                        </div>

                        {/* Address Line 2 */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Địa chỉ chi tiết (Tùy chọn)
                            </label>
                            <input
                                type="text"
                                name="address_line2"
                                value={formData.address_line2}
                                onChange={handleChange}
                                placeholder="Căn hộ 5B, Tầng 12"
                                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                            />
                        </div>

                        {/* Ward, District, City */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Phường/Xã
                                </label>
                                <input
                                    type="text"
                                    name="ward"
                                    value={formData.ward}
                                    onChange={handleChange}
                                    placeholder="Bến Nghé"
                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Quận/Huyện
                                </label>
                                <input
                                    type="text"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    placeholder="Quận 1"
                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Thành phố <span className="text-tet-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Hồ Chí Minh"
                                    className={`w-full px-4 py-3 rounded-lg border ${errors.city ? 'border-error' : 'border-border'
                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                />
                                {errors.city && (
                                    <p className="text-error text-sm mt-1">{errors.city}</p>
                                )}
                            </div>
                        </div>

                        {/* Postal Code and Country */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Mã bưu điện
                                </label>
                                <input
                                    type="text"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                    placeholder="700000"
                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Quốc gia
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                />
                            </div>
                        </div>

                        {/* Default Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="is_default"
                                id="is_default"
                                checked={formData.is_default}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-border text-tet-red focus:ring-2 focus:ring-tet-gold"
                            />
                            <label htmlFor="is_default" className="text-sm font-medium text-text-primary cursor-pointer">
                                Đặt làm địa chỉ mặc định
                            </label>
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
                                className="flex-1 btn-tet-primary disabled:opacity-50"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
