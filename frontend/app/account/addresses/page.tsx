'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AddressCard from '@/components/AddressCard';
import AddressModal from '@/components/AddressModal';
import { addressAPI, UserAddress } from '@/lib/api';

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const { data } = await addressAPI.list();
            // Handle paginated response - extract results array
            const addressesData = Array.isArray(data) ? data : (data as any).results || [];
            setAddresses(addressesData);
        } catch (error) {
            console.error('Error fetching addresses:', error);
            setAddresses([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const handleEditAddress = (address: UserAddress) => {
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleSaveAddress = async (data: Partial<UserAddress>) => {
        if (editingAddress) {
            // Update existing address
            await addressAPI.update(editingAddress.id, data);
        } else {
            // Create new address
            await addressAPI.create(data);
        }
        await fetchAddresses();
    };

    const handleDeleteAddress = async (id: number) => {
        try {
            await addressAPI.delete(id);
            await fetchAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Có lỗi xảy ra khi xóa địa chỉ.');
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

    return (
        <DashboardLayout>
            <div className="bg-card rounded-2xl border border-border shadow-md p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-tet-cream rounded-full">
                            <MapPin className="w-6 h-6 text-tet-red" />
                        </div>
                        <h1 className="text-2xl font-bold text-gradient-tet font-display">
                            Địa Chỉ Giao Hàng
                        </h1>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddAddress}
                        className="btn-tet-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Thêm địa chỉ</span>
                    </motion.button>
                </div>

                {/* Addresses Grid */}
                {addresses.length === 0 ? (
                    <EmptyState onAddAddress={handleAddAddress} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {addresses.map((address) => (
                                <AddressCard
                                    key={address.id}
                                    address={address}
                                    onEdit={handleEditAddress}
                                    onDelete={handleDeleteAddress}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AddressModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveAddress}
                address={editingAddress}
                title={editingAddress ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
            />
        </DashboardLayout>
    );
}

function EmptyState({ onAddAddress }: { onAddAddress: () => void }) {
    return (
        <div className="text-center py-20">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-32 h-32 mx-auto mb-6 rounded-full bg-tet-cream flex items-center justify-center"
            >
                <MapPin className="w-16 h-16 text-tet-gold" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Chưa có địa chỉ giao hàng
            </h2>
            <p className="text-text-secondary mb-8">
                Thêm địa chỉ để việc đặt hàng trở nên thuận tiện hơn
            </p>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onAddAddress}
                className="btn-tet-primary inline-flex items-center gap-2"
            >
                <Plus className="w-5 h-5" />
                <span>Thêm địa chỉ đầu tiên</span>
            </motion.button>
        </div>
    );
}
