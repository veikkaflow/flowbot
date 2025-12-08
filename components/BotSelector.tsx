
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
                className="flex items-center gap-3 p-2 rounded-lg transition-colors"
                style={{
                    color: 'var(--admin-text-primary, #f3f4f6)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <BrandLogo logoUrl={activeBot.settings.appearance.brandLogo} className="w-8 h-8 rounded-md object-contain p-1" style={{ backgroundColor: 'var(--admin-sidebar-bg, #4b5563)' }} />
                <span className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{activeBot.name}</span>
                <ChevronsUpDown className="w-4 h-4" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-64 rounded-lg shadow-lg z-50 animate-[fadeIn_0.1s_ease-out] border" style={{
                    backgroundColor: 'var(--admin-card-bg, #1f2937)',
                    borderColor: 'var(--admin-border, #374151)'
                }}>
                    <div className="p-2">
                        <p className="px-2 py-1 text-xs" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('bot.change')}</p>
                        {bots.map(bot => (
                            <button
                                key={bot.id}
                                onClick={() => {
                                    setActiveBotId(bot.id);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors"
                                style={{
                                    color: 'var(--admin-text-primary, #f3f4f6)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <BrandLogo logoUrl={bot.settings.appearance.brandLogo} className="w-6 h-6 rounded-md object-contain p-0.5" style={{ backgroundColor: 'var(--admin-sidebar-bg, #4b5563)' }} />
                                <span className="flex-1 truncate">{bot.name}</span>
                                {activeBot.id === bot.id && <Check className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />}
                            </button>
                        ))}
                    </div>
                    <div className="p-2 border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                         <button
                            onClick={onLogout}
                            className="w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors"
                            style={{ color: '#ef4444' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
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
