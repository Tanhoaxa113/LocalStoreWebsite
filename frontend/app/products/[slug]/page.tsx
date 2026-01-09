"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Check, Star, ChevronLeft } from "lucide-react";
import { productsAPI, cartAPI, type ProductDetail, type ProductVariant } from "@/lib/api";
import { useCartStore, useWishlistStore } from "@/lib/store";
import { cn, formatPrice, getStockStatus } from "@/lib/utils";

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    const { setCart } = useCartStore();
    const { isInWishlist, toggleItem } = useWishlistStore();

    useEffect(() => {
        if (slug) {
            loadProduct();
        }
    }, [slug]);

    const loadProduct = async () => {
        try {
            const { data } = await productsAPI.getProduct(slug);
            setProduct(data);
            // Set default variant from product or first variant
            setSelectedVariant(data.default_variant || data.variants[0]);
        } catch (error) {
            console.error("Failed to load product:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        try {
            const { data } = await cartAPI.addItem(selectedVariant.id, quantity);
            setCart(data);
            // TODO: Show success toast
        } catch (error) {
            console.error("Failed to add to cart:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pb-8">
                <div className="container">
                    <div className="animate-pulse space-y-8">
                        <div className="h-8 bg-winter-sky rounded w-1/4" />
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="aspect-square bg-winter-sky rounded-xl" />
                            <div className="space-y-6">
                                <div className="h-12 bg-winter-sky rounded" />
                                <div className="h-6 bg-winter-sky rounded w-3/4" />
                                <div className="h-24 bg-winter-sky rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen pb-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-display font-bold text-winter-deep mb-4">
                        Product not found
                    </h1>
                    <Link href="/products" className="text-tet-gold hover:underline">
                        Back to products
                    </Link>
                </div>
            </div>
        );
    }

    const stockStatus = selectedVariant ? getStockStatus(selectedVariant.stock_status) : null;
    const isWishlisted = isInWishlist(product.id);

    // SEO: JSON-LD structured data for Product and BreadcrumbList
    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.short_description || product.description?.replace(/<[^>]*>/g, '').substring(0, 200),
        image: product.thumbnail,
        brand: {
            "@type": "Brand",
            name: product.brand,
        },
        offers: {
            "@type": "Offer",
            url: `/products/${product.slug}`,
            priceCurrency: "VND",
            price: selectedVariant?.display_price || product.base_price,
            availability: product.in_stock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
        },
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Trang chủ",
                item: "/",
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Sản phẩm",
                item: "/products",
            },
            {
                "@type": "ListItem",
                position: 3,
                name: product.name,
            },
        ],
    };

    return (
        // SEO: Changed from div to main with article for semantic structure
        <main className="min-h-screen pb-8">
            {/* SEO: JSON-LD structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            <article className="container">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-winter-stone mb-8" aria-label="Đường dẫn">
                    <Link href="/" className="hover:text-tet-gold transition-colors">Trang chủ</Link>
                    <span aria-hidden="true">/</span>
                    <Link href="/products" className="hover:text-tet-gold transition-colors">Sản phẩm</Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-foreground" aria-current="page">{product.name}</span>
                </nav>

                {/* Product Content */}
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <motion.div
                            key={selectedImage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="aspect-square bg-winter-ice rounded-2xl overflow-hidden relative"
                        >
                            {product.media[selectedImage] ? (
                                <Image
                                    src={product.media[selectedImage].large_url || product.thumbnail || ""}
                                    alt={product.media[selectedImage].alt_text || product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-winter-stone">No image available</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Thumbnails */}
                        {product.media.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {product.media.map((media, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={cn(
                                            "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                            selectedImage === index
                                                ? "border-tet-gold shadow-lg"
                                                : "border-transparent hover:border-winter-frost"
                                        )}
                                    >
                                        {media.thumbnail_url && (
                                            <Image
                                                src={media.thumbnail_url}
                                                alt={media.alt_text || `${product.name} ${index + 1}`}
                                                width={100}
                                                height={100}
                                                className="object-cover w-full h-full"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Title & Wishlist */}
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-muted uppercase tracking-wide mb-2">
                                    {product.brand}
                                </p>
                                <h1 className="text-4xl font-display font-bold text-gradient-product">
                                    {product.name}
                                </h1>
                            </div>
                            {/* SEO: Added aria-label for accessibility */}
                            <button
                                onClick={() => toggleItem(product.id)}
                                className={cn(
                                    "p-3 rounded-full border-2 transition-all",
                                    isWishlisted
                                        ? "border-tet-red text-tet-red bg-tet-red/10"
                                        : "border-winter-frost text-winter-stone hover:border-tet-red hover:text-tet-red"
                                )}
                                aria-label={isWishlisted ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                            >
                                <Heart className={cn("w-6 h-6", isWishlisted && "fill-current")} />
                            </button>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            {selectedVariant?.is_on_sale ? (
                                <>
                                    <span className="text-3xl font-bold text-gradient-product">
                                        {formatPrice(selectedVariant.sale_price!)}
                                    </span>
                                    <span className="text-xl text-winter-stone line-through">
                                        {formatPrice(selectedVariant.price)}
                                    </span>
                                    <span className="px-3 py-1 bg-tet-red text-white text-sm font-semibold rounded-full">
                                        -{selectedVariant.discount_percentage}%
                                    </span>
                                </>
                            ) : (
                                <span className="text-3xl font-bold text-gradient-product">
                                    {selectedVariant ? formatPrice(selectedVariant.display_price) : formatPrice(product.base_price)}
                                </span>
                            )}
                        </div>

                        {/* Stock Status */}
                        {stockStatus && (
                            <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full", stockStatus.bg)}>
                                <div className={cn("w-2 h-2 rounded-full", stockStatus.color.replace("text-", "bg-"))} />
                                <span className={cn("text-sm font-medium", stockStatus.color)}>
                                    {stockStatus.label}
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-winter-deep prose-ul:text-winter-deep prose-li:text-winter-deep">
                            <div
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                        </div>

                        {/* Variant Selection */}
                        {product.variants.length > 0 && (
                            <div className="space-y-4">
                                {/* Color Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">
                                        Color: <span className="text-tet-gold">{selectedVariant?.color}</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(new Set(product.variants.map(v => v.color))).map((color) => {
                                            const variant = product.variants.find(v => v.color === color);
                                            const isSelected = selectedVariant?.color === color;
                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedVariant(variant!)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-lg border-2 transition-all",
                                                        isSelected
                                                            ? "border-tet-gold bg-tet-gold/10 text-foreground"
                                                            : "border-winter-frost text-winter-deep hover:border-tet-gold/50"
                                                    )}
                                                >
                                                    {color}
                                                    {isSelected && <Check className="inline-block w-4 h-4 ml-2" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Size Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">
                                        Size: <span className="text-tet-gold">{selectedVariant?.size}</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(new Set(product.variants.map(v => v.size))).map((size) => {
                                            const variant = product.variants.find(v => v.size === size);
                                            const isSelected = selectedVariant?.size === size;
                                            return (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedVariant(variant!)}
                                                    className={cn(
                                                        "w-12 h-12 rounded-lg border-2 font-semibold transition-all",
                                                        isSelected
                                                            ? "border-tet-gold bg-tet-gold/10 text-foreground"
                                                            : "border-winter-frost text-winter-deep hover:border-tet-gold/50"
                                                    )}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-3">Quantity</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-lg border border-winter-frost hover:border-tet-gold transition-colors flex items-center justify-center text-lg font-semibold"
                                    aria-label="Giảm số lượng"
                                >
                                    −
                                </button>
                                <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 rounded-lg border border-winter-frost hover:border-tet-gold transition-colors flex items-center justify-center text-lg font-semibold"
                                    aria-label="Tăng số lượng"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart */}
                        <motion.button
                            onClick={handleAddToCart}
                            disabled={!selectedVariant || selectedVariant.stock < quantity}
                            className={cn(
                                "w-full py-4 rounded-full font-semibold text-lg shadow-lg transition-all flex items-center justify-center gap-2",
                                selectedVariant && selectedVariant.stock >= quantity
                                    ? "bg-tet-red text-[#F5D562] hover:bg-tet-red-dark hover:shadow-xl"
                                    : "bg-winter-stone/20 text-winter-stone cursor-not-allowed"
                            )}
                            whileHover={selectedVariant && selectedVariant.stock >= quantity ? { scale: 1.02 } : {}}
                            whileTap={selectedVariant && selectedVariant.stock >= quantity ? { scale: 0.98 } : {}}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                        </motion.button>
                    </div>
                </div>
            </article>
        </main>
    );
}
