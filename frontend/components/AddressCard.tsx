'use client';

import { motion } from 'framer-motion';
import { MapPin, Edit, Trash2, Star } from 'lucide-react';
import { UserAddress } from '@/lib/api';

interface AddressCardProps {
    address: UserAddress;
    onEdit: (address: UserAddress) => void;
    onDelete: (id: number) => void;
}

export default function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4 }}
            className="glass-effect rounded-xl p-6 border-2 border-tet-gold/20 hover:border-tet-gold/40 transition-all duration-300"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-tet-cream rounded-full">
                        <MapPin className="w-5 h-5 text-tet-red" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gradient-product">
                            {address.label}
                        </h3>
                        {address.is_default && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 text-tet-gold fill-tet-gold" />
                                <span className="text-xs font-semibold text-tet-gold">
                                    Mặc định
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onEdit(address)}
                        className="p-2 hover:bg-tet-gold/10 rounded-lg transition-colors group"
                        title="Chỉnh sửa"
                    >
                        <Edit className="w-5 h-5 text-text-muted group-hover:text-tet-gold transition-colors" />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
                                onDelete(address.id);
                            }
                        }}
                        className="p-2 hover:bg-tet-red/10 rounded-lg transition-colors group"
                        title="Xóa"
                    >
                        <Trash2 className="w-5 h-5 text-text-muted group-hover:text-tet-red transition-colors" />
                    </motion.button>
                </div>
            </div>

            {/* Recipient Info */}
            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                        {address.recipient_name}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-secondary">
                        {address.recipient_phone}
                    </span>
                </div>

                {/* Address */}
                <p className="text-text-secondary leading-relaxed">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                    {address.ward && `, ${address.ward}`}
                    {address.district && `, ${address.district}`}
                    {`, ${address.city}`}
                    {address.postal_code && ` ${address.postal_code}`}
                    {address.country !== 'Vietnam' && `, ${address.country}`}
                </p>
            </div>
        </motion.div>
    );
}
