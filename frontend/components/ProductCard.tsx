"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/api";
import { cn, formatPrice, formatPriceRange, getStockStatus, calculateDiscount } from "@/lib/utils";
import { useWishlistStore } from "@/lib/store";
import Firework from "./effects/Firework";
import CoinShower from "./effects/CoinShower";

interface ProductCardProps {
    product: Product;
    onAddToCart?: (product: Product) => void;
    index?: number;
}

export default function ProductCard({ product, onAddToCart, index = 0 }: ProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const { isInWishlist, toggleItem } = useWishlistStore();
    const isWishlisted = isInWishlist(product.id);
    const [showFirework, setShowFirework] = useState(false);
    const [showCoinShower, setShowCoinShower] = useState(false);
    const [effectPosition, setEffectPosition] = useState({ x: 0, y: 0 });

    const stockStatus = product.default_variant
        ? getStockStatus(product.default_variant.stock_status)
        : null;

    const discount = product.default_variant?.is_on_sale
        ? calculateDiscount(
            parseFloat(product.default_variant.price),
            parseFloat(product.default_variant.sale_price!)
        )
        : 0;

    const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Get button position for effects
        const rect = e.currentTarget.getBoundingClientRect();
        setEffectPosition({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        });

        // Trigger celebration effects
        setShowFirework(true);
        setShowCoinShower(true);

        // Call the actual add to cart function
        onAddToCart?.(product);
    };

    // Calculate split entry direction based on 4-column grid
    // 0, 1 -> Slide from Left (-x)
    // 2, 3 -> Slide from Right (+x)
    const colIndex = index % 4;
    const isLeft = colIndex < 2;
    const initialX = isLeft ? -50 : 50;

    return (
        <>
            <motion.div
                className="group relative card-spotlight pointer-events-auto"
                initial={{ opacity: 0, x: initialX, scale: 0.9 }}
                whileInView={{
                    opacity: 1,
                    x: 0,
                    scale: [0.9, 1.05, 1], // Burst effect: Overshoot then settle
                }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{
                    duration: 0.6,
                    delay: (index % 4) * 0.1, // Stagger slightly based on column
                    ease: "easeOut"
                }}
                whileHover={{ scale: 1.05 }}
            >
                {/* Card Container - Tet Theme */}
                <div className="relative bg-card rounded-2xl border border-tet-gold/20 overflow-hidden shadow-md hover:shadow-2xl hover:border-tet-gold/50 transition-shadow duration-300">
                    {/* Image Container */}
                    <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-tet-cream rounded-t-2xl">
                        {product.thumbnail ? (
                            <>
                                <Image
                                    src={product.thumbnail}
                                    alt={product.name}
                                    fill
                                    className={cn(
                                        "object-cover transition-all duration-300 group-hover:scale-110",
                                        imageLoaded ? "opacity-100" : "opacity-0"
                                    )}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onLoad={() => setImageLoaded(true)}
                                />
                                {!imageLoaded && (
                                    <div className="absolute inset-0 bg-tet-silk animate-pulse" />
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-tet-silk">
                                <span className="text-muted text-sm">Chưa có ảnh</span>
                            </div>
                        )}

                        {/* Badges - Vietnamese */}
                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1 sm:gap-2 max-w-[calc(100%-4rem)] sm:max-w-[calc(100%-6rem)]">
                            {product.is_new_arrival && (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold lucky-envelope rounded-md shadow-lg" style={{ color: '#FFF4A3' }}>
                                    MỚI
                                </span>
                            )}
                            {discount > 0 && (
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-tet-red rounded-md shadow-lg" style={{ color: '#FFF4A3' }}>
                                    -{discount}%
                                </span>
                            )}
                            {product.is_best_seller && (
                                <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-tet-gold text-tet-red-dark rounded-md shadow-lg">
                                    BÁN CHẠY
                                </span>
                            )}
                        </div>

                        {/* Wishlist Button */}
                        <button
                            onClick={async (e) => {
                                e.preventDefault();

                                // Check if user is authenticated
                                const token = localStorage.getItem('auth_token');

                                if (token) {
                                    // Authenticated: sync with backend
                                    try {
                                        const { wishlistAPI } = await import("@/lib/api");

                                        if (isWishlisted) {
                                            await wishlistAPI.removeItem(product.id);
                                        } else {
                                            await wishlistAPI.addItem(product.id);
                                        }

                                        // Update local store for UI consistency
                                        toggleItem(product.id);
                                    } catch (error) {
                                        console.error("Wishlist error:", error);
                                    }
                                } else {
                                    // Guest: use local store only
                                    toggleItem(product.id);
                                }
                            }}
                            className={cn(
                                "absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full transition-all duration-200",
                                "bg-background/80 backdrop-blur-sm hover:bg-background",
                                isWishlisted ? "text-tet-red" : "text-muted hover:text-tet-red"
                            )}
                        >
                            <Heart
                                className={cn("w-4 h-4 sm:w-5 sm:h-5", isWishlisted && "fill-current")}
                            />
                        </button>
                    </Link>

                    {/* Product Info */}
                    <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Brand & Stock - Vietnamese */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-medium text-text-secondary uppercase tracking-wide">
                                {product.brand}
                            </span>
                            {stockStatus && (
                                <span className={cn("text-xs font-medium", stockStatus.color)}>
                                    {stockStatus.label}
                                </span>
                            )}
                        </div>

                        {/* Product Name */}
                        <Link href={`/products/${product.slug}`}>
                            <h3 className="font-display font-semibold text-sm sm:text-base text-gradient-product line-clamp-2 hover:text-tet-gold transition-colors min-h-[2.5rem] sm:min-h-[3rem]">
                                {product.name}
                            </h3>
                        </Link>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                            {product.short_description}
                        </p>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-col">
                                {product.default_variant?.is_on_sale ? (
                                    <>
                                        <span className="text-base sm:text-lg font-bold text-gradient-product">
                                            {formatPrice(product.default_variant.sale_price!)}
                                        </span>
                                        <span className="text-sm text-muted line-through">
                                            {formatPrice(product.default_variant.price)}
                                        </span>
                                    </>
                                ) : product.price_range ? (
                                    <span className="text-base sm:text-lg font-bold text-gradient-product">
                                        {formatPriceRange(product.price_range.min, product.price_range.max)}
                                    </span>
                                ) : (
                                    <span className="text-base sm:text-lg font-bold text-gradient-product">
                                        {formatPrice(product.base_price)}
                                    </span>
                                )}
                            </div>

                            <motion.button
                                onClick={handleAddToCart}
                                className={cn(
                                    "p-2 sm:p-3 rounded-full transition-all duration-200",
                                    "lucky-envelope shadow-md hover:shadow-lg hover:fortune-glow",
                                    !product.in_stock && "opacity-50 cursor-not-allowed"
                                )}
                                style={{ color: '#FFF4A3' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={!product.in_stock}
                                aria-label="Thêm vào giỏ hàng"
                            >
                                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Firework Effect */}
            {showFirework && (
                <Firework
                    x={effectPosition.x}
                    y={effectPosition.y}
                    onComplete={() => setShowFirework(false)}
                />
            )}

            {/* Coin Shower Effect */}
            {showCoinShower && (
                <CoinShower
                    x={effectPosition.x}
                    y={effectPosition.y}
                    onComplete={() => setShowCoinShower(false)}
                />
            )}
        </>
    );
}
