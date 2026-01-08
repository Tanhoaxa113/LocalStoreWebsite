import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, Product } from "./api";

// Cart Store
interface CartStore {
    cart: Cart | null;
    setCart: (cart: Cart) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            cart: null,
            setCart: (cart) => set({ cart }),
            clearCart: () => set({ cart: null }),
            isCartOpen: false,
            openCart: () => set({ isCartOpen: true }),
            closeCart: () => set({ isCartOpen: false }),
            toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
        }),
        {
            name: "cart-storage",
            partialize: (state) => ({ cart: state.cart }),
        }
    )
);

// UI Store
interface UIStore {
    isMobileMenuOpen: boolean;
    openMobileMenu: () => void;
    closeMobileMenu: () => void;
    toggleMobileMenu: () => void;

    searchQuery: string;
    setSearchQuery: (query: string) => void;

    isSearchOpen: boolean;
    openSearch: () => void;
    closeSearch: () => void;
    toggleSearch: () => void;

    effectsEnabled: boolean;
    enableEffects: () => void;
    disableEffects: () => void;
    toggleEffects: () => void;

    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    toggleTheme: () => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            isMobileMenuOpen: false,
            openMobileMenu: () => set({ isMobileMenuOpen: true }),
            closeMobileMenu: () => set({ isMobileMenuOpen: false }),
            toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

            searchQuery: "",
            setSearchQuery: (query) => set({ searchQuery: query }),

            isSearchOpen: false,
            openSearch: () => set({ isSearchOpen: true }),
            closeSearch: () => set({ isSearchOpen: false }),
            toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

            effectsEnabled: true, // Enabled by default
            enableEffects: () => set({ effectsEnabled: true }),
            disableEffects: () => set({ effectsEnabled: false }),
            toggleEffects: () => set((state) => ({ effectsEnabled: !state.effectsEnabled })),

            theme: 'light',
            setTheme: (theme) => {
                set({ theme });
                // Apply or remove dark class on document element
                if (typeof document !== 'undefined') {
                    if (theme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            },
            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light';
                // Apply or remove dark class on document element
                if (typeof document !== 'undefined') {
                    if (newTheme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
                return { theme: newTheme };
            }),
        }),
        {
            name: "ui-storage",
            partialize: (state) => ({ effectsEnabled: state.effectsEnabled, theme: state.theme }),
        }
    )
);

// Wishlist Store
interface WishlistStore {
    items: number[]; // Product IDs
    addItem: (productId: number) => void;
    removeItem: (productId: number) => void;
    toggleItem: (productId: number) => void;
    isInWishlist: (productId: number) => boolean;
    clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (productId) =>
                set((state) => ({
                    items: state.items.includes(productId)
                        ? state.items
                        : [...state.items, productId],
                })),
            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter((id) => id !== productId),
                })),
            toggleItem: (productId) =>
                set((state) => ({
                    items: state.items.includes(productId)
                        ? state.items.filter((id) => id !== productId)
                        : [...state.items, productId],
                })),
            isInWishlist: (productId) => get().items.includes(productId),
            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: "wishlist-storage",
        }
    )
);

// Filter Store for Product Listing
interface FilterStore {
    category: string | null;
    brand: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    color: string | null;
    lensType: string | null;
    material: string | null;
    size: string | null;
    inStock: boolean;
    sortBy: string;

    setCategory: (category: string | null) => void;
    setBrand: (brand: string | null) => void;
    setPriceRange: (min: number | null, max: number | null) => void;
    setColor: (color: string | null) => void;
    setLensType: (lensType: string | null) => void;
    setMaterial: (material: string | null) => void;
    setSize: (size: string | null) => void;
    setInStock: (inStock: boolean) => void;
    setSortBy: (sortBy: string) => void;
    clearFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
    category: null,
    brand: null,
    minPrice: null,
    maxPrice: null,
    color: null,
    lensType: null,
    material: null,
    size: null,
    inStock: false,
    sortBy: "-created_at",

    setCategory: (category) => set({ category }),
    setBrand: (brand) => set({ brand }),
    setPriceRange: (min, max) => set({ minPrice: min, maxPrice: max }),
    setColor: (color) => set({ color }),
    setLensType: (lensType) => set({ lensType }),
    setMaterial: (material) => set({ material }),
    setSize: (size) => set({ size }),
    setInStock: (inStock) => set({ inStock }),
    setSortBy: (sortBy) => set({ sortBy }),
    clearFilters: () =>
        set({
            category: null,
            brand: null,
            minPrice: null,
            maxPrice: null,
            color: null,
            lensType: null,
            material: null,
            size: null,
            inStock: false,
            sortBy: "-created_at",
        }),
}));

// Recently Viewed Store
interface RecentlyViewedStore {
    products: Product[];
    addProduct: (product: Product) => void;
    clearHistory: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
    persist(
        (set) => ({
            products: [],
            addProduct: (product) =>
                set((state) => {
                    // Remove if already exists, then add to front
                    const filtered = state.products.filter((p) => p.id !== product.id);
                    return {
                        products: [product, ...filtered].slice(0, 10), // Keep max 10
                    };
                }),
            clearHistory: () => set({ products: [] }),
        }),
        {
            name: "recently-viewed-storage",
        }
    )
);
