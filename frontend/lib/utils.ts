import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for intelligent class merging
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format price in VND
 */
export function formatPrice(price: number | string): string {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(numPrice);
}

/**
 * Format price range
 */
export function formatPriceRange(min: number | string, max: number | string): string {
    const minPrice = typeof min === "string" ? parseFloat(min) : min;
    const maxPrice = typeof max === "string" ? parseFloat(max) : max;

    if (minPrice === maxPrice) {
        return formatPrice(minPrice);
    }

    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + "...";
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function for search/input handling
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Generate slug from string
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Get stock status color and label
 */
export function getStockStatus(status: "in_stock" | "low_stock" | "out_of_stock") {
    const statusMap = {
        in_stock: { color: "text-success", label: "Còn hàng", bg: "bg-success/10" },
        low_stock: { color: "text-warning", label: "Sắp hết", bg: "bg-warning/10" },
        out_of_stock: { color: "text-error", label: "Hết hàng", bg: "bg-error/10" },
    };
    return statusMap[status];
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(original: number, sale: number): number {
    return Math.round(((original - sale) / original) * 100);
}

/**
 * Check if image is loaded
 */
export function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(d);
}

/**
 * Get rating stars display
 */
export function getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return { full, half, empty };
}
