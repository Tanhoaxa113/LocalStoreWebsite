"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

// Omit HTML animation event handlers that conflict with framer-motion
export interface ButtonProps extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
> {
    variant?: "primary" | "secondary";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: ReactNode;
    iconPosition?: "left" | "right";
    children: ReactNode;
}

export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconPosition = "right",
    className,
    disabled,
    children,
    type = "button",
    ...props
}: ButtonProps) {
    const baseClasses = "font-semibold rounded-full transition-all duration-200 flex items-center justify-center gap-2";

    const variantClasses = {
        primary: "bg-gradient-to-br from-tet-red to-tet-red-dark hover:from-tet-red-dark hover:to-tet-red shadow-lg hover:shadow-xl border-2 border-tet-gold text-[#FFF4A3]",
        secondary: "bg-background border-2 border-tet-red text-foreground hover:bg-tet-cream shadow-md hover:shadow-lg",
    };

    const sizeClasses = {
        sm: "px-4 h-9 text-sm",
        md: "px-6 h-12 text-base",
        lg: "px-8 h-14 text-lg",
    };

    const isDisabled = disabled || loading;

    return (
        <motion.button
            type={type}
            disabled={isDisabled}
            className={cn(
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                isDisabled && "opacity-50 cursor-not-allowed",
                className
            )}
            whileHover={!isDisabled ? { scale: 1.02 } : undefined}
            whileTap={!isDisabled ? { scale: 0.98 } : undefined}
            {...props}
        >
            {loading ? (
                <>
                    <span className="animate-spin">⏳</span>
                    {children}
                </>
            ) : (
                <>
                    {icon && iconPosition === "left" && icon}
                    {children}
                    {icon && iconPosition === "right" && icon}
                </>
            )}
        </motion.button>
    );
}
