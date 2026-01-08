'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, MapPin, CreditCard, FileText, Check, Plus, User } from 'lucide-react';
import { cartAPI, addressAPI, ordersAPI, CreateOrderData, UserAddress, api, vnpayAPI } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, setCart } = useCartStore();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [useManualAddress, setUseManualAddress] = useState(false);
    const [useCustomContact, setUseCustomContact] = useState(false);

    const [formData, setFormData] = useState<CreateOrderData>({
        email: '',
        phone: '',
        shipping_full_name: '',
        shipping_phone: '',
        shipping_address_line1: '',
        shipping_address_line2: '',
        shipping_ward: '',
        shipping_district: '',
        shipping_city: '',
        shipping_postal_code: '',
        shipping_country: 'Vietnam',
        payment_method: 'cod',
        customer_note: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load cart
            const { data: cartData } = await cartAPI.getCart();
            setCart(cartData);

            // Load user profile for contact info (will fail if not authenticated)
            try {
                const { data: profileData } = await api.get('/profile/me/');
                // Auto-fill email and phone from profile
                setFormData(prev => ({
                    ...prev,
                    email: profileData.email || '',
                    phone: profileData.phone_number || ''
                }));
            } catch (error) {
                console.log('Could not load profile, user may not be authenticated');
            }

            // Load addresses (will fail if not authenticated, that's ok)
            try {
                const { data: addressData } = await addressAPI.list();
                // Handle paginated response
                const addressesArray = Array.isArray(addressData) ? addressData : (addressData as any).results || [];
                setAddresses(addressesArray);

                // Auto-select default address
                const defaultAddress = addressesArray.find((addr: UserAddress) => addr.is_default);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                    populateAddressFields(defaultAddress);
                } else if (addressesArray.length > 0) {
                    // If no default, select first address
                    setSelectedAddressId(addressesArray[0].id);
                    populateAddressFields(addressesArray[0]);
                }
            } catch (error) {
                // User not authenticated or no addresses, use manual entry
                setUseManualAddress(true);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const populateAddressFields = (address: UserAddress) => {
        setFormData(prev => ({
            ...prev,
            shipping_full_name: address.recipient_name,
            shipping_phone: address.recipient_phone,
            shipping_address_line1: address.address_line1,
            shipping_address_line2: address.address_line2,
            shipping_ward: address.ward,
            shipping_district: address.district,
            shipping_city: address.city,
            shipping_postal_code: address.postal_code,
            shipping_country: address.country,
        }));
    };

    const handleAddressChange = (addressId: number) => {
        setSelectedAddressId(addressId);
        const address = addresses.find(addr => addr.id === addressId);
        if (address) {
            populateAddressFields(address);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Contact info validation
        if (!formData.email?.trim()) newErrors.email = 'Email là bắt buộc';
        if (!formData.phone?.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';

        // Shipping validation
        if (!formData.shipping_full_name?.trim()) newErrors.shipping_full_name = 'Vui lòng nhập tên người nhận';
        if (!formData.shipping_phone?.trim()) newErrors.shipping_phone = 'Vui lòng nhập số điện thoại người nhận';
        if (!formData.shipping_address_line1?.trim()) newErrors.shipping_address_line1 = 'Vui lòng nhập địa chỉ';
        if (!formData.shipping_city?.trim()) newErrors.shipping_city = 'Vui lòng nhập thành phố';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        setSubmitting(true);
        try {
            // Create order first
            const { data } = await ordersAPI.createOrder(formData);

            // Check if VNPAY payment method
            if (formData.payment_method === 'vnpay_qr' || formData.payment_method === 'vnpay_card') {
                // Determine payment type
                const paymentType = formData.payment_method === 'vnpay_qr' ? 'qr' : 'card';

                try {
                    // Create VNPAY payment URL
                    const paymentResponse = await vnpayAPI.createPayment(data.id, paymentType);

                    if (paymentResponse.data.success && paymentResponse.data.payment_url) {
                        // Redirect to VNPAY payment gateway
                        window.location.href = paymentResponse.data.payment_url;
                    } else {
                        throw new Error(paymentResponse.data.error || 'Không thể tạo liên kết thanh toán');
                    }
                } catch (paymentError: any) {
                    console.error('Error creating payment:', paymentError);
                    alert('Không thể tạo liên kết thanh toán VNPAY. Vui lòng thử lại.');
                    setSubmitting(false);
                }
            } else {
                // For other payment methods (COD, Banking)
                alert(`Đặt hàng thành công! Mã đơn hàng: ${data.order_number}`);
                // Clear cart
                setCart({ id: '', items: [], total_items: 0, subtotal: '0' });
                // Redirect to orders page
                router.push('/account/orders');
                setSubmitting(false);
            }
        } catch (error: any) {
            console.error('Error creating order:', error);
            const errorMsg = error.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại.';
            alert(errorMsg);
            setSubmitting(false);
        }
    };

    // Redirect if cart is empty
    useEffect(() => {
        if (!loading && (!cart || cart.items.length === 0)) {
            router.push('/cart');
        }
    }, [cart, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen pb-16">
                <div className="container">
                    <div className="animate-pulse space-y-6 py-12">
                        <div className="h-10 bg-tet-silk rounded w-1/4" />
                        <div className="h-64 bg-tet-silk rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen pb-16">
            <div className="container py-12">
                <h1 className="text-4xl font-display font-bold text-gradient-product mb-8">
                    Thanh Toán
                </h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Forms */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Optional Contact Information Override */}
                            {!useCustomContact ? (
                                <motion.button
                                    type="button"
                                    onClick={() => setUseCustomContact(true)}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-tet-gold transition-colors mb-2"
                                >
                                    <User className="w-4 h-4" />
                                    Sử dụng thông tin liên hệ khác
                                </motion.button>
                            ) : (
                                <div className="glass-effect rounded-xl p-6 border-2 border-tet-gold/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-foreground">
                                            Thông Tin Liên Hệ
                                        </h3>
                                        <motion.button
                                            type="button"
                                            onClick={() => setUseCustomContact(false)}
                                            whileTap={{ scale: 0.95 }}
                                            className="text-sm text-text-secondary hover:text-tet-red transition-colors"
                                        >
                                            Sử dụng mặc định
                                        </motion.button>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                Email <span className="text-tet-red">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-error' : 'border-border'
                                                    } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                                placeholder="email@example.com"
                                            />
                                            {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                Số điện thoại <span className="text-tet-red">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-error' : 'border-border'
                                                    } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                                placeholder="0909123456"
                                            />
                                            {errors.phone && <p className="text-error text-sm mt-1">{errors.phone}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Shipping Address */}
                            <div className="glass-effect rounded-xl p-6 border-2 border-tet-gold/20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-tet-cream rounded-full">
                                        <MapPin className="w-5 h-5 text-tet-red" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gradient-product">
                                        Địa Chỉ Giao Hàng
                                    </h2>
                                </div>

                                {/* Address Selection (if addresses available) */}
                                {addresses.length > 0 && !useManualAddress && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-text-primary mb-3">
                                            Chọn địa chỉ giao hàng
                                        </label>
                                        <div className="grid gap-3 mb-3">
                                            <AnimatePresence mode="popLayout">
                                                {addresses.map((addr) => (
                                                    <motion.div
                                                        key={addr.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        onClick={() => handleAddressChange(addr.id)}
                                                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAddressId === addr.id
                                                            ? 'border-tet-gold bg-tet-cream/30 shadow-md'
                                                            : 'border-border hover:border-tet-gold/40 hover:bg-tet-cream/10'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* Radio indicator */}
                                                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedAddressId === addr.id
                                                                ? 'border-tet-gold bg-tet-gold'
                                                                : 'border-border'
                                                                }`}>
                                                                {selectedAddressId === addr.id && (
                                                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                                )}
                                                            </div>

                                                            {/* Address details */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="font-semibold text-foreground">{addr.label}</p>
                                                                    {addr.is_default && (
                                                                        <span className="px-2 py-0.5 bg-tet-gold/20 text-tet-gold text-xs font-medium rounded">
                                                                            Mặc định
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-foreground font-medium">
                                                                    {addr.recipient_name} • {addr.recipient_phone}
                                                                </p>
                                                                <p className="text-sm text-text-secondary mt-1">
                                                                    {addr.full_address}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                        <motion.button
                                            type="button"
                                            onClick={() => setUseManualAddress(true)}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex items-center gap-2 text-sm text-tet-gold hover:text-tet-red font-medium transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Sử dụng địa chỉ mới
                                        </motion.button>
                                    </div>
                                )}

                                {(useManualAddress || addresses.length === 0) && addresses.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseManualAddress(false);
                                            if (addresses.length > 0) {
                                                const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
                                                setSelectedAddressId(defaultAddr.id);
                                                populateAddressFields(defaultAddr);
                                            }
                                        }}
                                        className="text-sm text-tet-gold hover:underline mb-4"
                                    >
                                        ← Chọn từ địa chỉ đã lưu
                                    </button>
                                )}

                                {/* Manual Address Fields */}
                                {(useManualAddress || addresses.length === 0) && (
                                    <div className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-2">
                                                    Tên người nhận <span className="text-tet-red">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="shipping_full_name"
                                                    value={formData.shipping_full_name}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 rounded-lg border ${errors.shipping_full_name ? 'border-error' : 'border-border'
                                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                                    placeholder="Nguyễn Văn A"
                                                />
                                                {errors.shipping_full_name && (
                                                    <p className="text-error text-sm mt-1">{errors.shipping_full_name}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-2">
                                                    Số điện thoại <span className="text-tet-red">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="shipping_phone"
                                                    value={formData.shipping_phone}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 rounded-lg border ${errors.shipping_phone ? 'border-error' : 'border-border'
                                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                                    placeholder="0909123456"
                                                />
                                                {errors.shipping_phone && (
                                                    <p className="text-error text-sm mt-1">{errors.shipping_phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                Địa chỉ <span className="text-tet-red">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_address_line1"
                                                value={formData.shipping_address_line1}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${errors.shipping_address_line1 ? 'border-error' : 'border-border'
                                                    } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                                placeholder="123 Lê Lợi"
                                            />
                                            {errors.shipping_address_line1 && (
                                                <p className="text-error text-sm mt-1">{errors.shipping_address_line1}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                Địa chỉ chi tiết (Tùy chọn)
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_address_line2"
                                                value={formData.shipping_address_line2}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                                placeholder="Căn hộ 5B"
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-2">
                                                    Phường/Xã
                                                </label>
                                                <input
                                                    type="text"
                                                    name="shipping_ward"
                                                    value={formData.shipping_ward}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                                    placeholder="Bến Nghé"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-2">
                                                    Quận/Huyện
                                                </label>
                                                <input
                                                    type="text"
                                                    name="shipping_district"
                                                    value={formData.shipping_district}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                                    placeholder="Quận 1"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-2">
                                                    Thành phố <span className="text-tet-red">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="shipping_city"
                                                    value={formData.shipping_city}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-3 rounded-lg border ${errors.shipping_city ? 'border-error' : 'border-border'
                                                        } focus:outline-none focus:ring-2 focus:ring-tet-gold`}
                                                    placeholder="Hồ Chí Minh"
                                                />
                                                {errors.shipping_city && (
                                                    <p className="text-error text-sm mt-1">{errors.shipping_city}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-2">
                                                    Mã bưu điện
                                                </label>
                                                <input
                                                    type="text"
                                                    name="shipping_postal_code"
                                                    value={formData.shipping_postal_code}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                                    placeholder="700000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-text-primary mb-2">
                                                    Quốc gia
                                                </label>
                                                <input
                                                    type="text"
                                                    name="shipping_country"
                                                    value={formData.shipping_country}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="glass-effect rounded-xl p-6 border-2 border-tet-gold/20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-tet-cream rounded-full">
                                        <CreditCard className="w-5 h-5 text-tet-red" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gradient-product">
                                        Phương Thức Thanh Toán
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { value: 'vnpay_qr', label: 'VNPAY', desc: 'Thanh toán qua ví VNPAY, ứng dụng ngân hàng hoặc thẻ ATM/Quốc tế' },
                                        { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán bằng tiền mặt khi nhận hàng' },
                                    ].map((method) => (
                                        <label
                                            key={method.value}
                                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.payment_method === method.value
                                                ? 'border-tet-gold bg-tet-cream/30 shadow-md'
                                                : 'border-border hover:border-tet-gold/40'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={method.value}
                                                checked={formData.payment_method === method.value}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-tet-red focus:ring-2 focus:ring-tet-gold mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <span className="text-text-primary font-medium block">{method.label}</span>
                                                <span className="text-sm text-text-secondary">{method.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Customer Note */}
                            <div className="glass-effect rounded-xl p-6 border-2 border-tet-gold/20">
                                <h2 className="text-lg font-bold text-gradient-product mb-4">
                                    Ghi Chú (Tùy chọn)
                                </h2>
                                <textarea
                                    name="customer_note"
                                    value={formData.customer_note}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-tet-gold resize-none"
                                    placeholder="Ghi chú cho người bán (ví dụ: giao hàng buổi sáng)"
                                />
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="glass-effect rounded-xl p-6 sticky top-28 border-2 border-tet-gold/30 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-tet-cream rounded-full">
                                        <ShoppingBag className="w-5 h-5 text-tet-red" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gradient-product">
                                        Đơn Hàng
                                    </h2>
                                </div>

                                {/* Cart Items */}
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {cart.items.map((item) => (
                                        <div key={item.id} className="flex gap-3 pb-4 border-b border-border">
                                            <div className="w-16 h-16 rounded-lg bg-tet-cream flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs text-tet-gold text-center">
                                                    {item.variant.color}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gradient-product line-clamp-1">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-xs text-text-muted">
                                                    {item.variant.color} • {item.variant.size}
                                                </p>
                                                <p className="text-sm font-medium text-text-secondary">
                                                    {item.quantity} x {formatPrice(item.variant.display_price)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Summary */}
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
                                            <span className="text-gradient-product text-2xl">
                                                {formatPrice(cart.subtotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={submitting}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-tet-primary w-full disabled:opacity-50"
                                >
                                    {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
                                </motion.button>

                                <Link
                                    href="/cart"
                                    className="block text-center text-sm text-tet-gold hover:underline"
                                >
                                    ← Quay lại giỏ hàng
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
