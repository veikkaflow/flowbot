
import React, { useState, useRef, useEffect } from 'react';
import { useBotContext } from '../context/BotContext.tsx';
import { ChevronsUpDown, LogOut, Check } from './Icons.tsx';
import { BrandLogo } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface BotSelectorProps {
    onLogout: () => void;
}

const BotSelector: React.FC<BotSelectorProps> = ({ onLogout }) => {
    const { bots, activeBot, setActiveBotId } = useBotContext();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    if (!activeBot) return null;

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700"
            >
                <BrandLogo logoUrl={activeBot.settings.appearance.brandLogo} className="w-8 h-8 rounded-md bg-gray-600 object-contain p-1" />
                <span className="font-semibold text-white">{activeBot.name}</span>
                <ChevronsUpDown className="w-4 h-4 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 animate-[fadeIn_0.1s_ease-out]">
                    <div className="p-2">
                        <p className="px-2 py-1 text-xs text-gray-400">{t('bot.change')}</p>
                        {bots.map(bot => (
                            <button
                                key={bot.id}
                                onClick={() => {
                                    setActiveBotId(bot.id);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-700"
                            >
                                <BrandLogo logoUrl={bot.settings.appearance.brandLogo} className="w-6 h-6 rounded-md bg-gray-600 object-contain p-0.5" />
                                <span className="flex-1 truncate">{bot.name}</span>
                                {activeBot.id === bot.id && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-gray-700 p-2">
                         <button
                            onClick={onLogout}
                            className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 text-red-400"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>{t('bot.logout')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BotSelector;
