"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useUIStore } from "@/lib/store";

/**
 * Effects Toggle Wrapper
 * Handles proper mounting/unmounting of particle effects
 */

// Dynamically import effects to avoid SSR issues
const SnowEffect = dynamic(
    () => import("@/components/effects/SnowEffect"),
    { ssr: false }
);

const FallingPetals = dynamic(
    () => import("@/components/effects/FallingPetals"),
    { ssr: false }
);

export default function TetEffects() {
    const effectsEnabled = useUIStore((state) => state.effectsEnabled);
    const [isTetSeason, setIsTetSeason] = useState(true); // Default to Tet

    useEffect(() => {
        // Clean up any lingering particle canvases when effects are disabled
        if (!effectsEnabled) {
            // Find and remove all tsparticles canvases
            const canvases = document.querySelectorAll('#tsparticles, #falling-petals-tet, canvas[data-generated="tsparticles"]');
            canvases.forEach(canvas => canvas.remove());
        }
    }, [effectsEnabled]);

    useEffect(() => {
        const now = new Date();
        const month = now.getMonth(); // 0-11

        // Month 0 (Jan) and 1 (Feb) are Tet Season (Spring) -> Petals
        // Month 11 (Dec) is Winter -> Snow
        const isWinter = month === 11;

        setIsTetSeason(!isWinter);
    }, []);

    // Don't render particle components when disabled
    if (!effectsEnabled) {
        return null;
    }

    return (
        <>
            {isTetSeason ? <FallingPetals key="petals" /> : <SnowEffect key="snow" />}
        </>
    );
}
