
import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-700">
            <button
                onClick={() => setLanguage('fi')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    language === 'fi'
                        ? 'bg-[var(--color-primary)] text-black'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
                FI
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    language === 'en'
                        ? 'bg-[var(--color-primary)] text-black'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSelector;
