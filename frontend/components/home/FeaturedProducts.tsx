"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "../ProductCard";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productsAPI, type Product } from "@/lib/api";

import { useCartStore } from "@/lib/store";

export default function FeaturedProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startIndex, setStartIndex] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const { setCart } = useCartStore();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await productsAPI.getFeatured();
                // Ensure response.data is an array, or handle accordingly depending on axios response structure (lib/api uses standard axios)
                // api.get returns response, and we type response.data.
                // However, productsAPI.getFeatured returns api.get<Product[]> which resolves to AxiosResponse<Product[]>
                if (Array.isArray(response.data)) {
                    setProducts(response.data);
                } else {
                    console.error("Invalid data format for featured products");
                }

            } catch (error) {
                console.error("Failed to fetch featured products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const itemsPerPage = 4;

    const nextSlide = () => {
        if (products.length === 0) return;
        setDirection(1);
        setStartIndex((prev) => (prev + itemsPerPage) % products.length);
    };

    const prevSlide = () => {
        if (products.length === 0) return;
        setDirection(-1);
        setStartIndex((prev) => (prev - itemsPerPage + products.length) % products.length);
    };

    const handleAddToCart = async (product: Product) => {
        if (!product.default_variant) return;

        try {
            const { cartAPI } = await import("@/lib/api");
            const { data } = await cartAPI.addItem(product.default_variant.id, 1);
            setCart(data);
            // Logic to open cart or show toast could be added here
        } catch (error) {
            console.error("Failed to add to cart:", error);
        }
    };

    // simplified pagination logic for current display
    const displayProducts = [];
    if (products.length > 0) {
        for (let i = 0; i < itemsPerPage; i++) {
            // Handle wrapping if we have fewer products than itemsPerPage, or just cycle
            // If products.length < itemsPerPage, we might repeat or just show available. 
            // Logic: (startIndex + i) % length handles wrapping perfectly even for small arrays
            displayProducts.push(products[(startIndex + i) % products.length]);
        }
    }

    return (
        // SEO: Added aria-label for accessibility
        <section className="py-28 relative overflow-hidden" aria-label="Sản phẩm nổi bật">
            {/* Decorative background elements removed for unified background */}

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient-tet">
                        Sản phẩm Nổi Bật
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                        Những mẫu kính mắt được yêu thích nhất trong bộ sưu tập Tết 2026.
                        <br />
                        Chất lượng Hàn Quốc, phong cách thời thượng.
                    </p>

                </motion.div>

                <div className="relative">
                    {/* Controls - Absolute positioned to sides */}
                    {products.length > itemsPerPage && (
                        <div className="hidden md:flex justify-between absolute top-1/2 -translate-y-1/2 -left-12 -right-12 z-20 pointer-events-none">
                            <button
                                onClick={prevSlide}
                                className="p-2 text-tet-red dark:text-tet-gold hover:text-tet-red-dark dark:hover:text-tet-gold-light transition-colors pointer-events-auto"
                                aria-label="Previous products"
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="p-2 text-tet-red dark:text-tet-gold hover:text-tet-red-dark dark:hover:text-tet-gold-light transition-colors pointer-events-auto"
                                aria-label="Next products"
                            >
                                <ChevronRight className="w-10 h-10" />
                            </button>
                        </div>
                    )}

                    {/* Product Grid Carousel */}
                    <div className="min-h-[400px] flex items-center justify-center">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-tet-gold" />
                                <p className="text-muted-foreground">Đang tải sản phẩm...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center text-muted-foreground">
                                <p>Chưa có sản phẩm nổi bật nào.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={startIndex}
                                    initial={{ opacity: 0, x: direction * 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: direction * -50 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full"
                                >
                                    {displayProducts.map((product, index) => (
                                        <ProductCard
                                            key={`${product.id}-${index}`}
                                            product={product}
                                            index={index}
                                            onAddToCart={handleAddToCart}
                                        />
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Mobile Controls */}
                    {!isLoading && products.length > itemsPerPage && (
                        <div className="mt-8 flex justify-between items-center md:hidden">
                            <div className="flex gap-8">
                                <button
                                    onClick={prevSlide}
                                    className="p-2 text-tet-red dark:text-tet-gold hover:text-tet-red-dark dark:hover:text-tet-gold-light transition-colors"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="p-2 text-tet-red dark:text-tet-gold hover:text-tet-red-dark dark:hover:text-tet-gold-light transition-colors"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </div>

                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 text-tet-gold font-medium"
                            >
                                Xem tất cả
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    <div className="mt-12 text-center">
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 text-tet-gold font-medium hover:text-tet-gold-dark transition-colors group text-lg"
                        >
                            Xem tất cả
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
