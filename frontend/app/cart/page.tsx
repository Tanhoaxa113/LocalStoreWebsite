"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { cartAPI, type Cart } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { cn, formatPrice } from "@/lib/utils";
import Button from "@/components/Button";

export default function CartPage() {
    const { cart, setCart } = useCartStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const { data } = await cartAPI.getCart();
            setCart(data);
        } catch (error) {
            console.error("Failed to load cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            const { data } = await cartAPI.updateItem(itemId, newQuantity);
            setCart(data);
        } catch (error) {
            console.error("Failed to update quantity:", error);
        }
    };

    const removeItem = async (itemId: number) => {
        try {
            const { data } = await cartAPI.removeItem(itemId);
            setCart(data);
        } catch (error) {
            console.error("Failed to remove item:", error);
        }
    };

    const clearCart = async () => {
        if (!confirm("Bạn có chắc muốn xóa toàn bộ giỏ hàng?")) return;

        try {
            const { data } = await cartAPI.clear();
            setCart(data);
        } catch (error) {
            console.error("Failed to clear cart:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pb-16">
                <div className="container">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-tet-silk rounded w-1/4" />
                        <div className="h-64 bg-tet-silk rounded" />
                    </div>
                </div>
            </div>
        );
    }

    const isEmpty = !cart || cart.items.length === 0;

    return (
        <div className="min-h-screen pb-16">
            <div className="container">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-display font-bold text-gradient-product">
                        Giỏ hàng
                    </h1>
                    {!isEmpty && (
                        <button
                            onClick={clearCart}
                            className="text-sm text-tet-red hover:underline"
                        >
                            Xóa tất cả
                        </button>
                    )}
                </div>

                {isEmpty ? (
                    <EmptyCart />
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {cart.items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="glass-effect rounded-xl p-6 border border-tet-gold/20"
                                    >
                                        <div className="flex gap-6">
                                            {/* Product Image */}
                                            <Link
                                                href={`/products/${item.product_slug}`}
                                                className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-tet-cream flex items-center justify-center"
                                            >
                                                <span className="text-tet-gold text-xs text-center">
                                                    {item.variant.color}
                                                </span>
                                            </Link>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    href={`/products/${item.product_slug}`}
                                                    className="font-semibold text-gradient-product hover:opacity-80 transition-opacity line-clamp-1"
                                                >
                                                    {item.product_name}
                                                </Link>
                                                <p className="text-sm text-foreground mt-1 font-medium">
                                                    {item.variant.color} • {item.variant.size}
                                                </p>
                                                <p className="text-lg font-bold text-gradient-product mt-2">
                                                    {formatPrice(item.variant.display_price)}
                                                </p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex flex-col items-end justify-between">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-tet-red hover:bg-tet-red/10 p-2 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="w-8 h-8 rounded-lg border border-tet-gold hover:bg-tet-gold/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-semibold">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={item.quantity >= item.variant.stock}
                                                        className="w-8 h-8 rounded-lg border border-tet-gold hover:bg-tet-gold/10 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <p className="text-lg font-bold text-gradient-product">
                                                    {formatPrice(item.total_price)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="glass-effect rounded-xl p-6 sticky top-28 space-y-6 border-2 border-tet-gold/30">
                                <h2 className="text-xl font-display font-semibold">Tổng đơn hàng</h2>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-foreground">
                                        <span>Tạm tính ({cart.total_items} sản phẩm)</span>
                                        <span>{formatPrice(cart.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-foreground">
                                        <span>Phí vận chuyển</span>
                                        <span className="text-success font-semibold">MIỄN PHÍ</span>
                                    </div>
                                    <div className="border-t border-tet-gold/20 pt-3">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Tổng cộng</span>
                                            <span className="text-gradient-product text-2xl">{formatPrice(cart.subtotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                <Link href="/checkout">
                                    <Button variant="primary" size="lg" className="w-full">
                                        Thanh toán ngay
                                    </Button>
                                </Link>

                                <Link href="/products">
                                    <Button variant="secondary" className="w-full">
                                        Tiếp tục mua sắm
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyCart() {
    return (
        <div className="text-center py-20">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-32 h-32 mx-auto mb-6 rounded-full bg-tet-cream flex items-center justify-center"
            >
                <ShoppingBag className="w-16 h-16 text-tet-gold" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                Giỏ hàng trống
            </h2>
            <p className="text-secondary mb-8">
                Bạn chưa thêm sản phẩm nào vào giỏ hàng
            </p>
            <Link href="/products">
                <Button variant="primary" size="lg">
                    Khám phá sản phẩm
                </Button>
            </Link>
        </div>
    );
}
