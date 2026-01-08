'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { wishlistAPI, cartAPI } from '@/lib/api';
import type { WishlistItem } from '@/lib/api';
import Firework from '@/components/effects/Firework';
import CoinShower from '@/components/effects/CoinShower';

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFirework, setShowFirework] = useState(false);
    const [showCoinShower, setShowCoinShower] = useState(false);
    const [effectPosition, setEffectPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const { data } = await wishlistAPI.getWishlist();
            setWishlist(data.items || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId: number) => {
        try {
            await wishlistAPI.removeItem(productId);
            setWishlist(wishlist.filter((item) => item.product.id !== productId));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    const addToCart = async (e: React.MouseEvent, productId: number, variantId?: number) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setEffectPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        });

        try {
            if (variantId) {
                await cartAPI.addItem(variantId, 1);

                // Trigger animations
                setShowFirework(true);
                setShowCoinShower(true);

                setTimeout(() => {
                    setShowFirework(false);
                    setShowCoinShower(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-tet-cream flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-tet-gold border-t-transparent mx-auto mb-4"></div>
                    <p className="text-text-muted">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tet-cream py-8">
            {/* Animation Effects */}
            {showFirework && <Firework x={effectPosition.x} y={effectPosition.y} />}
            {showCoinShower && <CoinShower x={effectPosition.x} y={effectPosition.y} />}

            <div className="container">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gradient-tet font-display mb-2">
                        Danh Sách Yêu Thích
                    </h1>
                    <p className="text-text-secondary">
                        {wishlist.length} sản phẩm
                    </p>
                </div>

                {/* Wishlist Grid */}
                {wishlist.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border shadow-md p-12 text-center">
                        <Heart className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                            Danh sách yêu thích trống
                        </h3>
                        <p className="text-text-muted mb-6">
                            Hãy thêm sản phẩm yêu thích để dễ dàng theo dõi!
                        </p>
                        <Link
                            href="/products"
                            className="btn-tet-primary inline-flex items-center"
                        >
                            Khám Phá Sản Phẩm
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-card rounded-2xl border border-border shadow-md overflow-hidden group hover:shadow-xl transition-shadow"
                            >
                                {/* Image */}
                                <Link
                                    href={`/products/${item.product.slug}`}
                                    className="block relative aspect-square overflow-hidden bg-tet-cream"
                                >
                                    {item.product.thumbnail ? (
                                        <Image
                                            src={item.product.thumbnail}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-text-muted">Chưa có ảnh</span>
                                        </div>
                                    )}
                                </Link>

                                {/* Content */}
                                <div className="p-4">
                                    <p className="text-sm text-text-secondary uppercase tracking-wide mb-1">
                                        {item.product.brand}
                                    </p>

                                    <Link href={`/products/${item.product.slug}`}>
                                        <h3 className="font-semibold text-gradient-product line-clamp-2 mb-3 hover:text-tet-gold transition-colors min-h-[3rem]">
                                            {item.product.name}
                                        </h3>
                                    </Link>

                                    {/* Price */}
                                    <div className="mb-4">
                                        {item.product.default_variant?.is_on_sale ? (
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-gradient-product">
                                                    {parseFloat(item.product.default_variant.sale_price!).toLocaleString('vi-VN')}₫
                                                </span>
                                                <span className="text-sm text-text-secondary line-through">
                                                    {parseFloat(item.product.default_variant.price).toLocaleString('vi-VN')}₫
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xl font-bold text-gradient-product">
                                                {parseFloat(item.product.base_price).toLocaleString('vi-VN')}₫
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <motion.button
                                            onClick={(e) => addToCart(e, item.product.id, item.product.default_variant?.id)}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-1 btn-tet-primary flex items-center justify-center gap-2"
                                            disabled={!item.product.in_stock}
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span>Thêm vào giỏ</span>
                                        </motion.button>

                                        <motion.button
                                            onClick={() => removeFromWishlist(item.product.id)}
                                            whileTap={{ scale: 0.95 }}
                                            className="p-3 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                            aria-label="Xóa khỏi yêu thích"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
