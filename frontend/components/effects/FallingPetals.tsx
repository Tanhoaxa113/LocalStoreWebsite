"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

/**
 * Falling Petals Effect - Tet Holiday Theme
 * Mưa hoa mai/đào - Apricot/Peach Blossom Petals
 */
export default function FallingPetals() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);


    if (!init) {
        return null;
    }

    return (
        <Particles
            id="falling-petals-tet"
            options={{
                background: {
                    color: {
                        value: "transparent",
                    },
                },
                fpsLimit: 60,
                interactivity: {
                    events: {
                        onClick: {
                            enable: true,
                            mode: "push",
                        },
                        onHover: {
                            enable: true,
                            mode: "bubble",
                        },
                    },
                    modes: {
                        push: {
                            quantity: 4,
                        },
                        bubble: {
                            distance: 200,
                            size: 10,
                            duration: 2,
                            opacity: 0.8,
                        },
                    },
                },
                particles: {
                    // Apricot (Yellow/Gold) and Peach (Pink/Red)
                    color: {
                        value: ["#FFD700", "#FFC0CB", "#FFB7C5", "#FDB9C8", "#FFDAB9"],
                    },
                    move: {
                        direction: "bottom-right",
                        enable: true,
                        outModes: {
                            default: "out",
                        },
                        random: false,
                        speed: 1.0,
                        straight: false,
                        attract: {
                            enable: false,
                            rotate: {
                                x: 600,
                                y: 1200
                            }
                        },
                        gravity: {
                            enable: false, // Disabled to prevent acceleration/speeding up
                            acceleration: 0
                        }
                    },
                    number: {
                        density: {
                            enable: true,
                            width: 1920,
                            height: 1080,
                        },
                        value: 40, // Not too crowded
                    },
                    opacity: {
                        value: { min: 0.6, max: 0.9 },
                        animation: {
                            enable: true,
                            speed: 0.5,
                            sync: false
                        },
                    },
                    shape: {
                        type: "circle", // Pure circles look more like distant petals than squares
                    },
                    size: {
                        value: { min: 3, max: 6 },
                        animation: {
                            enable: true,
                            speed: 2,
                            sync: false,
                        },
                    },
                    rotate: {
                        value: {
                            min: 0,
                            max: 360,
                        },
                        direction: "random",
                        animation: {
                            enable: true,
                            speed: 5,
                            sync: false,
                        },
                    },
                    wobble: {
                        distance: 30,
                        enable: true,
                        speed: {
                            min: 3,
                            max: 7,
                        },
                    },
                },
                detectRetina: true,
                fullScreen: {
                    enable: true,
                    zIndex: 0, // Behind most UI but visible
                },
            }}
            className="fixed inset-0 pointer-events-none z-0"
        />
    );
}
