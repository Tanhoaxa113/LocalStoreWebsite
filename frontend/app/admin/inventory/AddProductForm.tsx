"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface AddProductFormProps {
    onSuccess: (newVariant: any) => void;
    onCancel: () => void;
}

export default function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Product Fields
        name: '',
        brand: '',
        category: '',
        base_price: '',
        short_description: '',
        description: '',
        target_gender: 'unisex',

        // Variant Fields
        color: '',
        size: 'M',
        material: 'acetate',
        lens_type: 'clear',
        stock: 0 // Initial stock is 0, will be imported via the main modal
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/categories/`);
            setCategories(response.data.results || response.data);
        } catch (err) {
            console.error('Failed to fetch categories');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');

            // Construct payload matching ProductCreateSerializer
            const payload = {
                name: formData.name,
                brand: formData.brand,
                category: formData.category,
                base_price: parseFloat(formData.base_price),
                short_description: formData.short_description || formData.name,
                description: formData.description || formData.name,
                target_gender: formData.target_gender,
                initial_variant: {
                    color: formData.color,
                    size: formData.size,
                    material: formData.material,
                    lens_type: formData.lens_type,
                    price: parseFloat(formData.base_price), // Default variant price to base price
                    stock: 0
                }
            };

            const response = await axios.post(
                `${API_BASE_URL}/products/`,
                payload,
                { headers: { Authorization: `Token ${token}` } }
            );

            // Fetch the newly created variant details to pass back
            // The response returns the product. We can fetch variants for this product.
            const variantsResponse = await axios.get(
                `${API_BASE_URL}/variants/?product_slug=${response.data.slug}`,
                { headers: { Authorization: `Token ${token}` } }
            );

            if (variantsResponse.data.results && variantsResponse.data.results.length > 0) {
                onSuccess(variantsResponse.data.results[0]);
            } else {
                // Fallback
                setError('Đã tạo sản phẩm nhưng không lấy được thông tin biến thể.');
            }

        } catch (err: any) {
            setError(err.response?.data?.message || JSON.stringify(err.response?.data) || 'Tạo sản phẩm thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-4 text-gradient-tet">Add New Product</h3>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm break-words">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Info */}
                    <div className="space-y-4 border-r border-border pr-4">
                        <h4 className="font-semibold text-lg text-gradient-tet">Thông Tin Sản Phẩm</h4>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Tên Sản Phẩm *</label>
                            <input required name="name" value={formData.name} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">Thương Hiệu *</label>
                                <input required name="brand" value={formData.brand} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">Danh Mục *</label>
                                <select required name="category" value={formData.category} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground">
                                    <option value="">Chọn...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">Giá Cơ Bản *</label>
                                <input required type="number" step="0.01" name="base_price" value={formData.base_price} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">Giới Tính</label>
                            <select name="target_gender" value={formData.target_gender} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground">
                                <option value="unisex">Unisex</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="kids">Trẻ Em</option>
                            </select>
                        </div>
                    </div>

                    {/* Variant Info */}
                    <div className="space-y-4 pl-4">
                        <h4 className="font-semibold text-lg text-gradient-tet">Thông Tin Biến Thể Ban Đầu</h4>

                        <div>
                            {/* SKU is auto-generated */}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">Màu Sắc *</label>
                                <input required name="color" value={formData.color} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">Kích Thước *</label>
                                <select required name="size" value={formData.size} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground">
                                    <option value="XS">XS (Siêu Nhỏ)</option>
                                    <option value="S">S (Nhỏ)</option>
                                    <option value="M">M (Vừa)</option>
                                    <option value="L">L (Lớn)</option>
                                    <option value="XL">XL (Siêu Lớn)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">Chất Liệu</label>
                                <select name="material" value={formData.material} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground">
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
                                <select name="lens_type" value={formData.lens_type} onChange={handleChange} className="w-full border rounded px-3 py-2 bg-background text-foreground">
                                    <option value="clear">Trong Suốt</option>
                                    <option value="prescription">Có Độ</option>
                                    <option value="polarized">Phân Cực</option>
                                    <option value="photochromic">Đổi Màu</option>
                                    <option value="blue_light">Lọc Ánh Sáng Xanh</option>
                                    <option value="sunglasses">Kính Mát</option>
                                </select>
                            </div>
                        </div>
                    </div>
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
                        {loading ? 'Đang tạo...' : 'Tạo Sản Phẩm'}
                    </button>
                </div>
            </form>
        </div>
    );
}
