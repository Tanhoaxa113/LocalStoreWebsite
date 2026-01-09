"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useUIStore();
    const [mounted, setMounted] = useState(false);

    // Apply theme on mount and when theme changes
    useEffect(() => {
        setMounted(true);
        if (typeof document !== 'undefined') {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [theme]);

    if (!mounted) {
        return <div className="w-9 h-9" />; // Placeholder to prevent layout shift
    }

    return (
        <motion.button
            onClick={toggleTheme}
            className={cn(
                "relative p-2 rounded-full transition-all duration-300",
                theme === 'dark'
                    ? "bg-tet-cream/10 text-tet-gold hover:bg-tet-cream/20"
                    : "bg-tet-red/5 text-tet-red hover:bg-tet-red/10"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                >
                    {theme === 'dark' ? (
                        <Moon className="w-5 h-5 fill-current" />
                    ) : (
                        <Sun className="w-5 h-5 fill-current" />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}
