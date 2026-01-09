"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

import AddProductForm from './AddProductForm';
import AddVariantForm from './AddVariantForm';

// ... (existing VariantInfo and InventoryLog interfaces)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface VariantInfo {
    id: number;
    sku: string;
    product_name: string;
    product_brand: string;
    color: string;
    size: string;
    stock: number;
    low_stock_threshold: number;
    is_low_stock: boolean;
    is_out_of_stock: boolean;
}

interface InventoryLog {
    id: number;
    variant_info: {
        sku: string;
        product_name: string;
        color: string;
        size: string;
    };
    quantity_change: number;
    transaction_type: string;
    transaction_type_display: string;
    transaction_id: string;
    stock_before: number;
    stock_after: number;
    created_by_name: string | null;
    created_at: string;
}

interface ImportStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function ImportStockModal({ isOpen, onClose, onSuccess }: ImportStockModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<VariantInfo[]>([]);
    const [selectedItems, setSelectedItems] = useState<Array<{ variantData: VariantInfo; quantity: number }>>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isAddingVariant, setIsAddingVariant] = useState(false);

    const searchVariants = async () => {
        if (!searchTerm.trim()) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_BASE_URL}/variants/`, {
                params: { search: searchTerm },
                headers: { Authorization: `Token ${token}` }
            });
            setSearchResults(response.data.results || response.data);
        } catch (err) {
            console.error('Search error:', err);
        }
    };

    const addItem = (variant: VariantInfo) => {
        if (!selectedItems.find(item => item.variantData.id === variant.id)) {
            setSelectedItems([...selectedItems, { variantData: variant, quantity: 10 }]);
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    const updateQuantity = (variantId: number, quantity: number) => {
        setSelectedItems(items =>
            items.map(item =>
                item.variantData.id === variantId ? { ...item, quantity } : item
            )
        );
    };

    const removeItem = (variantId: number) => {
        setSelectedItems(items => items.filter(item => item.variantData.id !== variantId));
    };

    const submitImport = async () => {
        if (selectedItems.length === 0) {
            setError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            // Transform selectedItems to API format
            const items = selectedItems.map(item => ({
                variant: item.variantData.id,
                quantity: item.quantity
            }));
            const response = await axios.post(
                `${API_BASE_URL}/warehouse/import-notes/`,
                { items, notes },
                { headers: { Authorization: `Token ${token}` } }
            );

            // Complete the import note immediately
            await axios.post(
                `${API_BASE_URL}/warehouse/import-notes/${response.data.id}/complete/`,
                {},
                { headers: { Authorization: `Token ${token}` } }
            );

            setSelectedItems([]);
            setNotes('');
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Tạo phiếu nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gradient-tet">
                        {isAddingNew ? 'Thêm Sản Phẩm Mới' : isAddingVariant ? 'Thêm Biến Thể Mới' : 'Nhập Kho'}
                    </h2>
                    {!isAddingNew && !isAddingVariant && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddingVariant(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                                + Thêm Biến Thể
                            </button>
                            <button
                                onClick={() => setIsAddingNew(true)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                                + Thêm Sản Phẩm Mới
                            </button>
                        </div>
                    )}
                </div>

                {isAddingNew ? (
                    <AddProductForm
                        onSuccess={(variant) => {
                            addItem(variant);
                            setIsAddingNew(false);
                        }}
                        onCancel={() => setIsAddingNew(false)}
                    />
                ) : isAddingVariant ? (
                    <AddVariantForm
                        onSuccess={(variant) => {
                            addItem(variant);
                            setIsAddingVariant(false);
                        }}
                        onCancel={() => setIsAddingVariant(false)}
                    />
                ) : (
                    <>
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {/* Search for variants */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-foreground">Tìm Kiếm Sản Phẩm</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchVariants()}
                                    placeholder="Tìm theo SKU hoặc tên sản phẩm..."
                                    className="flex-1 border border-border rounded px-3 py-2 bg-background text-foreground"
                                />
                                <button
                                    onClick={searchVariants}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Tìm Kiếm
                                </button>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="mt-2 border border-border rounded max-h-48 overflow-y-auto">
                                    {searchResults.map((variant) => (
                                        <div
                                            key={variant.id}
                                            onClick={() => addItem(variant)}
                                            className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 transition-colors"
                                        >
                                            <div className="font-semibold text-foreground">{variant.product_name}</div>
                                            <div className="text-sm text-text-muted mt-1">
                                                <span className="font-mono bg-muted px-2 py-0.5 rounded">{variant.sku}</span>
                                                <span className="mx-2">•</span>
                                                <span>{variant.product_brand}</span>
                                                <span className="mx-2">•</span>
                                                <span>{variant.color} - {variant.size}</span>
                                                <span className="mx-2">•</span>
                                                <span className={variant.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    Tồn: {variant.stock}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Items */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-foreground">Sản Phẩm Nhập ({selectedItems.length})</label>
                            {selectedItems.length === 0 ? (
                                <p className="text-text-muted text-sm">Chưa có sản phẩm nào</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedItems.map((item) => (
                                        <div key={item.variantData.id} className="flex items-center gap-2 p-3 border border-border rounded bg-muted/30">
                                            <div className="flex-1">
                                                <div className="font-medium text-foreground">{item.variantData.product_name}</div>
                                                <div className="text-sm text-text-muted">
                                                    {item.variantData.sku} • {item.variantData.color} - {item.variantData.size}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.variantData.id, parseInt(e.target.value))}
                                                    className="border border-border rounded px-3 py-2 w-24 bg-background text-foreground"
                                                    min="1"
                                                />
                                                <button
                                                    onClick={() => removeItem(item.variantData.id)}
                                                    className="text-red-500 hover:text-red-700 px-2"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-foreground">Ghi Chú</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Nhà cung cấp, lý do, v.v."
                                className="w-full border border-border rounded px-3 py-2 bg-background text-foreground"
                                rows={3}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-border rounded hover:bg-muted"
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitImport}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                disabled={loading || selectedItems.length === 0}
                            >
                                {loading ? 'Đang xử lý...' : 'Nhập Kho'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function InventoryPage() {
    const [lowStockVariants, setLowStockVariants] = useState<VariantInfo[]>([]);
    const [recentLogs, setRecentLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [stats, setStats] = useState({
        total_variants: 0,
        low_stock_count: 0,
        out_of_stock_count: 0
    });

    const fetchInventoryData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const headers = { Authorization: `Token ${token}` };

            // Fetch low stock variants
            const lowStockResponse = await axios.get(`${API_BASE_URL}/warehouse/inventory/low_stock/`, { headers });
            setLowStockVariants(lowStockResponse.data.results || []);

            // Fetch recent logs
            const logsResponse = await axios.get(`${API_BASE_URL}/warehouse/inventory/logs/`, {
                headers,
                params: { page_size: 20 }
            });
            setRecentLogs(logsResponse.data.results || []);

            // Fetch stats
            const statsResponse = await axios.get(`${API_BASE_URL}/warehouse/inventory/stats/`, { headers });
            setStats(statsResponse.data);

        } catch (error) {
            console.error('Error fetching inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryData();
    }, []);

    const getQuantityColor = (change: number) => {
        if (change > 0) return 'text-green-600 font-semibold';
        if (change < 0) return 'text-red-600 font-semibold';
        return '';
    };

    const getStockRowClass = (variant: VariantInfo) => {
        // Keep rows clean without background colors
        return '';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-text-muted">Đang tải dữ liệu tồn kho...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gradient-tet">Quản Lý Kho Hàng</h1>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        + Nhập Kho
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-card p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <div className="text-text-secondary text-sm">Tổng Biến Thể</div>
                        <div className="text-2xl font-bold text-foreground">{stats.total_variants}</div>
                    </div>
                    <div className="bg-card p-6 rounded-lg shadow border-l-4 border-orange-500">
                        <div className="text-text-secondary text-sm">Sắp Hết Hàng (≤5)</div>
                        <div className="text-2xl font-bold text-orange-600">{stats.low_stock_count}</div>
                    </div>
                    <div className="bg-card p-6 rounded-lg shadow border-l-4 border-red-500">
                        <div className="text-text-secondary text-sm">Hết Hàng</div>
                        <div className="text-2xl font-bold text-red-600">{stats.out_of_stock_count}</div>
                    </div>
                </div>

                {/* Low Stock Table */}
                <div className="bg-card rounded-lg shadow mb-6 overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-semibold text-gradient-tet">Cảnh Báo Sắp Hết Hàng</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Sản Phẩm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Màu / Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Tồn Kho</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Trạng Thái</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {lowStockVariants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                                            ✓ Tất cả sản phẩm đều đủ tồn kho
                                        </td>
                                    </tr>
                                ) : (
                                    lowStockVariants.map((variant) => (
                                        <tr key={variant.id} className={`hover:bg-muted/50 ${getStockRowClass(variant)}`}>
                                            <td className="px-6 py-4 text-foreground">{variant.product_name}</td>
                                            <td className="px-6 py-4 font-mono text-sm text-foreground">{variant.sku}</td>
                                            <td className="px-6 py-4 text-foreground">{variant.color} - {variant.size}</td>
                                            <td className="px-6 py-4 font-bold text-foreground">{variant.stock}</td>
                                            <td className="px-6 py-4">
                                                {variant.is_out_of_stock ? (
                                                    <span className="text-red-600 font-semibold">HẾT HÀNG</span>
                                                ) : (
                                                    <span className="text-orange-600 font-semibold">SẮP HẾT</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Logs */}
                <div className="bg-card rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-semibold text-gradient-tet">Giao Dịch Kho Gần Đây</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Ngày/Giờ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Sản Phẩm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Loại</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Thay Đổi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Tồn Sau</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Mã Tham Chiếu</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {recentLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                                            Không có giao dịch gần đây
                                        </td>
                                    </tr>
                                ) : (
                                    recentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4 text-sm text-foreground">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{log.variant_info.product_name}</div>
                                                <div className="text-sm text-text-muted">{log.variant_info.sku}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${log.transaction_type === 'IMPORT' ? 'bg-green-100 text-green-700' :
                                                    log.transaction_type === 'ORDER' ? 'bg-blue-100 text-blue-700' :
                                                        log.transaction_type === 'REFUND' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {
                                                        {
                                                            'IMPORT': 'Nhập Kho',
                                                            'ORDER': 'Đơn Hàng',
                                                            'REFUND': 'Hoàn Trả',
                                                            'ADJUSTMENT': 'Điều Chỉnh'
                                                        }[log.transaction_type] || log.transaction_type
                                                    }
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 ${getQuantityColor(log.quantity_change)}`}>
                                                {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-foreground">{log.stock_after}</td>
                                            <td className="px-6 py-4 text-sm font-mono text-foreground">{log.transaction_id}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Import Modal */}
                <ImportStockModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={fetchInventoryData}
                />
            </div>
        </div>
    );
}
