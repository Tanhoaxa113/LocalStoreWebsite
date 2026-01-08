"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container, Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

export default function SnowEffect() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container): Promise<void> => {
        console.log("Snow particles loaded", container);
    };

    const options = useMemo(
        () => ({
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
                        mode: "repulse",
                    },
                },
                modes: {
                    push: {
                        quantity: 4,
                    },
                    repulse: {
                        distance: 100,
                        duration: 0.4,
                    },
                },
            },
            particles: {
                color: {
                    value: "#ffffff",
                },
                links: {
                    enable: false,
                },
                move: {
                    direction: "bottom" as const,
                    enable: true,
                    outModes: {
                        default: "out" as const,
                    },
                    random: true,
                    speed: 1.5,
                    straight: false,
                },
                number: {
                    density: {
                        enable: true,
                    },
                    value: 100,
                },
                opacity: {
                    value: { min: 0.3, max: 0.7 },
                },
                shape: {
                    type: "circle",
                },
                size: {
                    value: { min: 1, max: 3 },
                },
                wobble: {
                    enable: true,
                    distance: 10,
                    speed: 10,
                },
                zIndex: {
                    value: { min: 0, max: 100 },
                },
            },
            detectRetina: true,
        }),
        []
    );

    if (!init) {
        return null;
    }

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <Particles
                id="tsparticles"
                particlesLoaded={particlesLoaded}
                options={options}
            />
        </div>
    );
}
