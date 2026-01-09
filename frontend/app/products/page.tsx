"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Filter, X, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { productsAPI, type Product } from "@/lib/api";
import { useFilterStore, useCartStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function ProductsContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const searchParams = useSearchParams();
    const filters = useFilterStore();
    const { setCart } = useCartStore();

    useEffect(() => {
        loadProducts();
    }, [filters, searchParams]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const params: any = {
                ordering: filters.sortBy,
            };

            if (filters.category) params.category = filters.category;
            if (filters.brand) params.brand = filters.brand;
            if (filters.minPrice) params.min_price = filters.minPrice;
            if (filters.maxPrice) params.max_price = filters.maxPrice;
            if (filters.color) params.color = filters.color;
            if (filters.lensType) params.lens_type = filters.lensType;
            if (filters.material) params.material = filters.material;
            if (filters.size) params.size = filters.size;
            if (filters.inStock) params.in_stock = "true";

            // Add URL query parameters
            if (searchParams.get('is_best_seller') === 'true') params.is_best_seller = 'true';
            if (searchParams.get('is_new_arrival') === 'true') params.is_new_arrival = 'true';

            // Add search query parameter
            const searchQuery = searchParams.get('search');
            if (searchQuery) params.search = searchQuery;

            const { data } = await productsAPI.getProducts(params);
            setProducts(data.results);
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (product: Product) => {
        if (!product.default_variant) return;

        try {
            const { cartAPI } = await import("@/lib/api");
            const { data } = await cartAPI.addItem(product.default_variant.id, 1);
            setCart(data);
            // TODO: Show success toast
        } catch (error) {
            console.error("Failed to add to cart:", error);
            // TODO: Show error toast
        }
    };

    return (
        // SEO: Changed from div to main for semantic structure
        <main className="min-h-screen pb-16">
            <div className="container">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-gradient-product mb-2">
                            {searchParams.get('search')
                                ? `Kết quả tìm kiếm: "${searchParams.get('search')}"`
                                : searchParams.get('is_best_seller') === 'true'
                                    ? 'Bán Chạy Nhất'
                                    : searchParams.get('is_new_arrival') === 'true'
                                        ? 'Hàng Mới Về'
                                        : 'Tất Cả Sản Phẩm'}
                        </h1>
                        <p className="text-foreground">
                            {loading ? "Đang tải..." : `${products.length} sản phẩm`}
                        </p>
                    </div>

                    {/* Sort & Filter Toggle */}
                    <div className="flex items-center gap-4">
                        <select
                            value={filters.sortBy}
                            onChange={(e) => filters.setSortBy(e.target.value)}
                            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tet-gold"
                        >
                            <option value="-created_at">Mới nhất</option>
                            <option value="created_at">Cũ nhất</option>
                            <option value="base_price">Giá: Thấp đến Cao</option>
                            <option value="-base_price">Giá: Cao đến Thấp</option>
                            <option value="name">Tên: A-Z</option>
                            <option value="-name">Tên: Z-A</option>
                        </select>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-winter-deep rounded-lg hover:bg-winter-night transition-colors group"
                        >
                            <Filter className="w-5 h-5 text-tet-gold" />
                            <span className="hidden sm:inline font-bold text-gradient-product">Bộ Lọc</span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Filters Sidebar */}
                    <motion.aside
                        className={cn(
                            "w-80",
                            showFilters ? "block" : "hidden lg:block"
                        )}
                        initial={false}
                        animate={{ x: showFilters ? 0 : -100 }}
                    >
                        <div className="glass-effect rounded-xl p-6 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-display font-bold text-xl text-gradient-product">Bộ Lọc</h2>
                                <button
                                    onClick={() => filters.clearFilters()}
                                    className="text-sm text-tet-gold hover:underline"
                                >
                                    Xóa tất cả
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Price Range */}
                                <FilterSection title="Khoảng Giá">
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder="Tối thiểu"
                                                value={filters.minPrice || ""}
                                                onChange={(e) => filters.setPriceRange(Number(e.target.value) || null, filters.maxPrice)}
                                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Tối đa"
                                                value={filters.maxPrice || ""}
                                                onChange={(e) => filters.setPriceRange(filters.minPrice, Number(e.target.value) || null)}
                                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                            />
                                        </div>
                                    </div>
                                </FilterSection>

                                {/* Lens Type */}
                                <FilterSection title="Loại Kính">
                                    <FilterCheckbox
                                        label="Trong suốt"
                                        checked={filters.lensType === "clear"}
                                        onChange={() => filters.setLensType(filters.lensType === "clear" ? null : "clear")}
                                    />
                                    <FilterCheckbox
                                        label="Có độ"
                                        checked={filters.lensType === "prescription"}
                                        onChange={() => filters.setLensType(filters.lensType === "prescription" ? null : "prescription")}
                                    />
                                    <FilterCheckbox
                                        label="Phân cực"
                                        checked={filters.lensType === "polarized"}
                                        onChange={() => filters.setLensType(filters.lensType === "polarized" ? null : "polarized")}
                                    />
                                    <FilterCheckbox
                                        label="Lọc ánh sáng xanh"
                                        checked={filters.lensType === "blue_light"}
                                        onChange={() => filters.setLensType(filters.lensType === "blue_light" ? null : "blue_light")}
                                    />
                                </FilterSection>

                                {/* Material */}
                                <FilterSection title="Chất Liệu">
                                    <FilterCheckbox label="Nhựa Acetate" checked={filters.material === "acetate"} onChange={() => filters.setMaterial(filters.material === "acetate" ? null : "acetate")} />
                                    <FilterCheckbox label="Kim loại" checked={filters.material === "metal"} onChange={() => filters.setMaterial(filters.material === "metal" ? null : "metal")} />
                                    <FilterCheckbox label="Titan" checked={filters.material === "titanium"} onChange={() => filters.setMaterial(filters.material === "titanium" ? null : "titanium")} />
                                    <FilterCheckbox label="Nhựa" checked={filters.material === "plastic"} onChange={() => filters.setMaterial(filters.material === "plastic" ? null : "plastic")} />
                                    <FilterCheckbox label="Gỗ" checked={filters.material === "wood"} onChange={() => filters.setMaterial(filters.material === "wood" ? null : "wood")} />
                                </FilterSection>

                                {/* Size */}
                                <FilterSection title="Kích Thước">
                                    {["XS", "S", "M", "L", "XL"].map((size) => (
                                        <FilterCheckbox
                                            key={size}
                                            label={size}
                                            checked={filters.size === size}
                                            onChange={() => filters.setSize(filters.size === size ? null : size)}
                                        />
                                    ))}
                                </FilterSection>

                                {/* Availability */}
                                <FilterSection title="Tình Trạng">
                                    <FilterCheckbox
                                        label="Còn hàng"
                                        checked={filters.inStock}
                                        onChange={() => filters.setInStock(!filters.inStock)}
                                    />
                                </FilterSection>
                            </div>
                        </div>
                    </motion.aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-96 bg-winter-sky animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-xl text-winter-stone mb-4">Không tìm thấy sản phẩm</p>
                                <button
                                    onClick={() => filters.clearFilters()}
                                    className="text-tet-gold hover:underline"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="spotlight-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pointer-events-none">
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border-b border-border pb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full mb-3"
            >
                <h3 className="font-bold text-lg text-gradient-product">{title}</h3>
                <ChevronDown
                    className={cn(
                        "w-5 h-5 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>
            {isOpen && <div className="space-y-2">{children}</div>}
        </div>
    );
}

function FilterCheckbox({
    label,
    checked,
    onChange,
    gradient = false,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
    gradient?: boolean;
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 rounded border-winter-stone text-tet-gold focus:ring-tet-gold"
            />
            <span className={cn(
                "text-sm transition-colors",
                gradient ? "text-gradient-product font-medium" : "text-winter-deep group-hover:text-tet-gold"
            )}>
                {label}
            </span>
        </label>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="container py-8 text-center">Loading products...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
