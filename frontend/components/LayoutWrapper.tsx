"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { useUIStore } from "@/lib/store";
import { useEffect } from "react";

interface LayoutWrapperProps {
    children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
    const pathname = usePathname();
    const { theme } = useUIStore();

    // Sync theme with document class
    useEffect(() => {
        const root = window.document.documentElement;
        // Remove both to ensure clean slate, although usually we just toggle
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    // Pages where we don't want navbar/footer
    const noLayoutPages = ["/auth/login", "/auth/register"];
    const shouldShowLayout = !noLayoutPages.includes(pathname);
    const isHomePage = pathname === "/";

    return (
        <div className="mx-auto max-w-[1920px] px-3 sm:px-4">
            {shouldShowLayout && <Navigation />}
            <main className={shouldShowLayout && !isHomePage ? "pt-20" : ""}>
                {children}
            </main>
            {shouldShowLayout && <Footer />}
        </div>
    );
}
