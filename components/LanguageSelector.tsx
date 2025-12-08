
import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center rounded-lg p-1 border" style={{
            backgroundColor: 'var(--admin-sidebar-bg, #1f2937)',
            borderColor: 'var(--admin-border, #374151)'
        }}>
            <button
                onClick={() => setLanguage('fi')}
                className="px-3 py-1.5 text-xs font-bold rounded-md transition-colors"
                style={{
                    backgroundColor: language === 'fi' ? 'var(--color-primary)' : 'transparent',
                    color: language === 'fi' ? 'black' : 'var(--admin-text-secondary, #d1d5db)'
                }}
                onMouseEnter={(e) => {
                    if (language !== 'fi') {
                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (language !== 'fi') {
                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                    }
                }}
            >
                FI
            </button>
            <button
                onClick={() => setLanguage('en')}
                className="px-3 py-1.5 text-xs font-bold rounded-md transition-colors"
                style={{
                    backgroundColor: language === 'en' ? 'var(--color-primary)' : 'transparent',
                    color: language === 'en' ? 'black' : 'var(--admin-text-secondary, #d1d5db)'
                }}
                onMouseEnter={(e) => {
                    if (language !== 'en') {
                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (language !== 'en') {
                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                    }
                }}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSelector;
