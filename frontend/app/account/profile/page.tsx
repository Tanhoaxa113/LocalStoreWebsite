'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, Edit } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import EditProfileModal from '@/components/EditProfileModal';
import { api } from '@/lib/api';

interface UserProfile {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // ViewSet retrieve action expects a pk, use 'me' as identifier
            const response = await api.get('/profile/me/');
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (data: Partial<UserProfile>) => {
        try {
            // Custom action doesn't need pk
            const response = await api.patch('/profile/update_profile/', data);
            setProfile(response.data);
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="bg-card rounded-2xl border border-border shadow-md p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-tet-gold border-t-transparent mx-auto mb-4"></div>
                    <p className="text-text-muted">Đang tải...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!profile) {
        return (
            <DashboardLayout>
                <div className="bg-card rounded-2xl border border-border shadow-md p-12 text-center">
                    <p className="text-text-muted">Không thể tải thông tin hồ sơ.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="bg-card rounded-2xl border border-border shadow-md p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-tet-cream rounded-full">
                            <User className="w-6 h-6 text-tet-red" />
                        </div>
                        <h1 className="text-2xl font-bold text-gradient-tet font-display">
                            Hồ Sơ Cá Nhân
                        </h1>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="btn-tet-primary flex items-center gap-2"
                    >
                        <Edit className="w-5 h-5" />
                        <span>Chỉnh sửa</span>
                    </motion.button>
                </div>

                {/* Profile Information */}
                <div className="space-y-6">
                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">
                                Họ
                            </label>
                            <div className="px-4 py-3 rounded-lg bg-tet-cream border border-border">
                                <p className="text-text-primary font-medium">
                                    {profile.first_name || '—'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">
                                Tên
                            </label>
                            <div className="px-4 py-3 rounded-lg bg-tet-cream border border-border">
                                <p className="text-text-primary font-medium">
                                    {profile.last_name || '—'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email
                        </label>
                        <div className="px-4 py-3 rounded-lg bg-tet-cream border border-border">
                            <p className="text-text-primary font-medium">
                                {profile.email}
                            </p>
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                            Email không thể thay đổi
                        </p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">
                            <Phone className="w-4 h-4 inline mr-2" />
                            Số điện thoại
                        </label>
                        <div className="px-4 py-3 rounded-lg bg-tet-cream border border-border">
                            <p className="text-text-primary font-medium">
                                {profile.phone_number || '—'}
                            </p>
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Ngày sinh
                        </label>
                        <div className="px-4 py-3 rounded-lg bg-tet-cream border border-border">
                            <p className="text-text-primary font-medium">
                                {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <EditProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProfile}
                profile={profile}
            />
        </DashboardLayout>
    );
}
