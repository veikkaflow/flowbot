// components/BackgroundAnimation.tsx
import React from 'react';
import { BackgroundAnimation as AnimationType } from '../types.ts';

interface BackgroundAnimationProps {
    animation: AnimationType;
}

const BackgroundAnimation: React.FC<BackgroundAnimationProps> = ({ animation }) => {
    if (animation === 'none' || !animation) {
        return null;
    }

    const animationContainerStyle = {
        '--animation-opacity': 0.15
    } as React.CSSProperties;

    return (
        <div className="animation-container" style={animationContainerStyle}>
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
        </div>
    );
};

export default BackgroundAnimation;