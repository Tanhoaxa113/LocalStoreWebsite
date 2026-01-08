'use client';

import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

/**
 * Tet Falling Petals Animation
 * Mưa hoa mai/đào - Traditional Vietnamese Tet decoration
 */
export default function TetPetals() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesConfig: ISourceOptions = {
        fullScreen: {
            enable: true,
            zIndex: 0,
        },
        fpsLimit: 60,
        particles: {
            number: {
                value: 40,
                density: {
                    enable: true,
                },
            },
            color: {
                value: ['#FFD700', '#FFC0CB', '#FFB7C5', '#FDB9C8', '#FFDAB9'], // Gold, Pink, Peach
            },
            shape: {
                type: 'circle',
            },
            opacity: {
                value: { min: 0.4, max: 0.8 },
                animation: {
                    enable: true,
                    speed: 0.5,
                    sync: false,
                },
            },
            size: {
                value: { min: 3, max: 6 },
            },
            move: {
                enable: true,
                speed: 0.8, // Slowed down from 2 for very gentle float
                direction: 'bottom-right',
                random: false,
                straight: false,
                outModes: {
                    default: 'out',
                },
            },
            rotate: {
                value: { min: 0, max: 360 },
                direction: 'random',
                animation: {
                    enable: true,
                    speed: 5,
                    sync: false,
                },
            },
            wobble: {
                enable: true,
                distance: 30,
                speed: {
                    min: 3,
                    max: 7,
                },
            },
        },
        detectRetina: true,
    };

    if (!init) return null;

    return (
        <Particles
            id="tet-petals"
            options={particlesConfig}
            className="pointer-events-none"
        />
    );
}
