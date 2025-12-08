
import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import { Sun, Moon } from './Icons.tsx';

const ThemeSelector: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center rounded-lg p-1 border" style={{
            backgroundColor: 'var(--admin-sidebar-bg, #1f2937)',
            borderColor: 'var(--admin-border, #374151)'
        }}>
            <button
                onClick={() => setTheme('dark')}
                className="px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5"
                style={{
                    backgroundColor: theme === 'dark' ? 'var(--color-primary)' : 'transparent',
                    color: theme === 'dark' ? 'black' : 'var(--admin-text-secondary, #d1d5db)'
                }}
                onMouseEnter={(e) => {
                    if (theme !== 'dark') {
                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (theme !== 'dark') {
                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                    }
                }}
                title="Tumma teema"
            >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
            </button>
            <button
                onClick={() => setTheme('light')}
                className="px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5"
                style={{
                    backgroundColor: theme === 'light' ? 'var(--color-primary)' : 'transparent',
                    color: theme === 'light' ? 'black' : 'var(--admin-text-secondary, #d1d5db)'
                }}
                onMouseEnter={(e) => {
                    if (theme !== 'light') {
                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (theme !== 'light') {
                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                    }
                }}
                title="Vaalea teema"
            >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
            </button>
        </div>
    );
};

export default ThemeSelector;
