"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Product {
    id: number;
    name: string;
    slug: string;
    brand: string;
    base_price: string;
    sku_prefix: string;
}

interface AddVariantFormProps {
    onSuccess: (newVariant: any) => void;
    onCancel: () => void;
}

export default function AddVariantForm({ onSuccess, onCancel }: AddVariantFormProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setError] = useState('');

    const [variantData, setVariantData] = useState({
        color: '',
        size: 'M',
        material: 'acetate',
        lens_type: 'clear',
        price: '',
        stock: 0
    });

    const searchProducts = async () => {
        if (!searchTerm) return;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_BASE_URL}/products/`, {
                params: { search: searchTerm },
                headers: { Authorization: `Token ${token}` }
            });
            setProducts(response.data.results || response.data);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            const payload = {
                product: selectedProduct.id,
                color: variantData.color,
                size: variantData.size,
                material: variantData.material,
                lens_type: variantData.lens_type,
                price: parseFloat(variantData.price) || parseFloat(selectedProduct.base_price),
                stock: 0, // Initial stock 0, import via modal
                is_active: true
            };

            const response = await axios.post(
                `${API_BASE_URL}/variants/`,
                payload,
                { headers: { Authorization: `Token ${token}` } }
            );

            onSuccess(response.data);
        } catch (error: any) {
            setError(error.response?.data?.message || JSON.stringify(error.response?.data) || 'Failed to create variant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-4 text-gradient-tet">Thêm Biến Thể Mới</h3>

            {err && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {err}
                </div>
            )}

            {!selectedProduct ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Tìm Sản Phẩm</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                                placeholder="Nhập tên sản phẩm..."
                                className="flex-1 border border-border rounded px-3 py-2 bg-background text-foreground"
                            />
                            <button
                                onClick={searchProducts}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Tìm
                            </button>
                        </div>
                    </div>

                    {products.length > 0 && (
                        <div className="border border-border rounded max-h-60 overflow-y-auto">
                            {products.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setVariantData(prev => ({ ...prev, price: product.base_price }));
                                    }}
                                    className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                                >
                                    <div className="font-semibold text-foreground">{product.name}</div>
                                    <div className="text-sm text-text-muted">{product.brand} • {product.sku_prefix}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end mt-4 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-border rounded hover:bg-muted text-foreground"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-between items-center bg-muted p-3 rounded mb-4">
                        <span className="font-medium text-foreground">{selectedProduct.name}</span>
                        <button
                            type="button"
                            onClick={() => setSelectedProduct(null)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Thay đổi
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Màu Sắc *</label>
                            <input
                                required
                                value={variantData.color}
                                onChange={(e) => setVariantData({ ...variantData, color: e.target.value })}
                                className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                                placeholder="VD: Black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Kích Thước *</label>
                            <select
                                required
                                value={variantData.size}
                                onChange={(e) => setVariantData({ ...variantData, size: e.target.value })}
                                className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                            >
                                <option value="XS">XS (Siêu Nhỏ)</option>
                                <option value="S">S (Nhỏ)</option>
                                <option value="M">M (Vừa)</option>
                                <option value="L">L (Lớn)</option>
                                <option value="XL">XL (Siêu Lớn)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Chất Liệu</label>
                            <select
                                value={variantData.material}
                                onChange={(e) => setVariantData({ ...variantData, material: e.target.value })}
                                className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                            >
                                <option value="acetate">Acetate</option>
                                <option value="metal">Kim Loại</option>
                                <option value="titanium">Titanium</option>
                                <option value="plastic">Nhựa</option>
                                <option value="wood">Gỗ</option>
                                <option value="mixed">Hỗn Hợp</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Loại Tròng</label>
                            <select
                                value={variantData.lens_type}
                                onChange={(e) => setVariantData({ ...variantData, lens_type: e.target.value })}
                                className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                            >
                                <option value="clear">Trong Suốt</option>
                                <option value="prescription">Có Độ</option>
                                <option value="polarized">Phân Cực</option>
                                <option value="photochromic">Đổi Màu</option>
                                <option value="blue_light">Lọc Ánh Sáng Xanh</option>
                                <option value="sunglasses">Kính Mát</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Giá Bán *</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            value={variantData.price}
                            onChange={(e) => setVariantData({ ...variantData, price: e.target.value })}
                            className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-border rounded hover:bg-muted text-foreground"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Đang tạo...' : 'Tạo Biến Thể'}
                        </button>
                    </div>
                </form>
            )
            }
        </div >
    );
}
