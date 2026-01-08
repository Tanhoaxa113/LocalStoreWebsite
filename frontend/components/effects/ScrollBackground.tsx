"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useUIStore } from "@/lib/store";
import { useEffect, useState } from "react";

export default function ScrollBackground() {
    const { scrollYProgress } = useScroll();
    const { theme } = useUIStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Light Theme Colors (Tet Theme)
    // Start: Tet Paper/Cream (#FFFAF0) -> Mid: Tet Silk (#FFF5E6) -> End: Soft Gold (#FDE6BA)
    const lightColors = ["#FFFAF0", "#FFF5E6", "#FDE6BA"];

    // Dark Theme Colors
    // Start: Dark Background (#1A0F00) -> Mid: Dark Cream (#2D1B00) -> End: Deep Bronze (#3E2500)
    const darkColors = ["#1A0F00", "#2D1B00", "#3E2500"];

    const bgColorLight = useTransform(scrollYProgress, [0, 0.5, 1], lightColors);
    const bgColorDark = useTransform(scrollYProgress, [0, 0.5, 1], darkColors);

    // Initial render (SSR) might mismatch if we don't handle mounting, 
    // but for background colors, a slight flash is better than hydration error.
    // We use 'mounted' to ensure we access the correct theme store.

    if (!mounted) {
        return <div className="fixed inset-0 -z-50 bg-background" />;
    }

    return (
        <motion.div
            className="fixed inset-0 -z-50 h-full w-full"
            style={{
                backgroundColor: theme === 'dark' ? bgColorDark : bgColorLight
            }}
        >
            {/* Optional: Subtle Texture Overlay to add depth without interrupting the gradient */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            />
        </motion.div>
    );
}
