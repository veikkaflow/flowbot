// components/BackgroundAnimation.tsx
import React, { useMemo } from 'react';
import { BackgroundAnimation as AnimationType } from '../types.ts';

interface BackgroundAnimationProps {
    animation: AnimationType;
}

// Staattinen taulukko particles-animaatiolle - luodaan vain kerran
const PARTICLES_COUNT = 20;
const PARTICLES_ARRAY = Array.from({ length: PARTICLES_COUNT });

const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({ animation }) => {
    // Memoize container style - luodaan uudelleen vain jos animation muuttuu
    const animationContainerStyle = useMemo(() => ({
        '--animation-opacity': 0.15
    } as React.CSSProperties), []);

    // Memoize particles-elementit - lasketaan uudelleen vain jos animation muuttuu
    const particlesElements = useMemo(() => {
        if (animation !== 'particles') return null;
        return PARTICLES_ARRAY.map((_, i) => (
            <div 
                key={i} 
                className="particle" 
                style={{ 
                    left: `${(i * 5) % 100}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${15 + (i % 10)}s`
                }}
            ></div>
        ));
    }, [animation]);

    if (animation === 'none' || !animation) {
        return null;
    }

    return (
        <div 
            className="animation-container" 
            style={{
                ...animationContainerStyle,
                position: 'absolute', // Vahvistaa inline-tyylillä
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        >
            {animation === 'aurora' && (
                <>
                    <div className="aurora-shape" style={{ width: '400px', height: '400px', top: '10%', left: '10%', background: 'var(--animation-color-1)' }}></div>
                    <div className="aurora-shape" style={{ width: '300px', height: '300px', top: '50%', left: '70%', background: 'var(--animation-color-2)', animationDelay: '-10s' }}></div>
                    <div className="aurora-shape" style={{ width: '200px', height: '200px', top: '80%', left: '20%', background: 'var(--animation-color-3)', animationDelay: '-20s' }}></div>
                </>
            )}
            {animation === 'waves' && (
                <>
                    <div className="wave wave-1"></div>
                    <div className="wave wave-2"></div>
                </>
            )}
            {animation === 'geometric' && (
                 <>
                    <div className="geometric-shape shape-1"></div>
                    <div className="geometric-shape shape-2"></div>
                    <div className="geometric-shape shape-3"></div>
                </>
            )}
            {animation === 'gradient' && (
                <div className="shifting-gradient-container w-full h-full"></div>
            )}
            {animation === 'particles' && particlesElements}
            {animation === 'pulse' && (
                <>
                    <div className="pulse-ring pulse-ring-1"></div>
                    <div className="pulse-ring pulse-ring-2"></div>
                    <div className="pulse-ring pulse-ring-3"></div>
                </>
            )}
            {animation === 'mesh' && (
                <div className="mesh-grid"></div>
            )}
        </div>
    );
};

// Memoize komponentti - renderöidään uudelleen vain jos animation prop muuttuu
export default React.memo(BackgroundAnimation);