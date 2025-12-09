
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePersonality } from '../hooks/usePersonality.ts';
import { Scenario, QuickReply, IconName } from '../types.ts';
import { Smile, Plus, Trash2, ChevronsUpDown } from './Icons.tsx';
import * as Icons from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useDebouncedSave } from '../hooks/useDebouncedSave.ts';

const iconOptions = Object.keys(Icons).filter(key => key[0] === key[0].toUpperCase() && key !== 'BrandLogo') as IconName[];

const getIconComponent = (iconName: IconName): React.FC<React.SVGProps<SVGSVGElement>> => {
    return Icons[iconName] || Icons.HelpCircle;
};

// Custom Icon Selector Component
const IconSelector: React.FC<{ value: IconName; onChange: (value: IconName) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const CurrentIcon = getIconComponent(value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm w-full min-w-[180px] border transition-colors"
                style={{
                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                    borderColor: 'var(--admin-border, #374151)',
                    color: 'var(--admin-text-primary, #f3f4f6)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                }}
            >
                <CurrentIcon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span className="flex-1 text-left">{value}</span>
                <ChevronsUpDown className="w-4 h-4" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md shadow-lg max-h-60 overflow-auto border" style={{
                    backgroundColor: 'var(--admin-dropdown-bg, #1f2937)',
                    borderColor: 'var(--admin-border, #374151)',
                    opacity: '1'
                }}>
                    {iconOptions.map(iconName => {
                        const Icon = getIconComponent(iconName);
                        const isSelected = value === iconName;
                        return (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => {
                                    onChange(iconName);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                                style={{
                                    backgroundColor: isSelected ? 'var(--admin-dropdown-selected, #374151)' : 'transparent',
                                    color: 'var(--admin-text-primary, #f3f4f6)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'var(--admin-dropdown-hover, #374151)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                                <span className="text-left">{iconName}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const PersonalitySettings: React.FC = () => {
    const { personality, updateSettings, addScenario, updateScenario, deleteScenario, addQuickReply, updateQuickReply, deleteQuickReply } = usePersonality();
    const { t } = useLanguage();

    // Debounced save for custom instruction
    const [customInstruction, setCustomInstruction, isSavingInstruction] = useDebouncedSave(
        personality?.customInstruction,
        (value) => updateSettings({ customInstruction: value })
    );

    // Debounced save for opening messages
    const [openingMessageFi, setOpeningMessageFi, isSavingOpeningFi] = useDebouncedSave(
        personality?.openingMessage?.fi,
        (value) => updateSettings({
            openingMessage: {
                ...personality?.openingMessage,
                fi: value
            }
        })
    );

    const [openingMessageEn, setOpeningMessageEn, isSavingOpeningEn] = useDebouncedSave(
        personality?.openingMessage?.en,
        (value) => updateSettings({
            openingMessage: {
                ...personality?.openingMessage,
                en: value
            }
        })
    );

    if (!personality) return null;

    // Local state for quick replies and scenarios (for immediate UI updates)
    const [localQuickReplies, setLocalQuickReplies] = useState<QuickReply[]>(personality?.quickReplies || []);
    const [localScenarios, setLocalScenarios] = useState<Scenario[]>(personality?.scenarios || []);

    // Sync local state when personality changes
    useEffect(() => {
        if (personality) {
            setLocalQuickReplies(personality.quickReplies || []);
            setLocalScenarios(personality.scenarios || []);
        }
    }, [personality?.quickReplies, personality?.scenarios]);

    // Debounced handlers for scenarios and quick replies
    const scenarioTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const quickReplyTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const handleScenarioChange = useCallback((id: string, field: keyof Scenario, value: string) => {
        // Update local state immediately
        setLocalScenarios(prev => {
            const updated = prev.map(s => s.id === id ? { ...s, [field]: value } : s);
            
            // Clear existing timeout for this scenario
            const existingTimeout = scenarioTimeouts.current.get(id);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            // Set new timeout with updated value
            const timeout = setTimeout(() => {
                const scenario = updated.find(s => s.id === id);
                if (scenario) {
                    updateScenario({ ...scenario, [field]: value });
                }
                scenarioTimeouts.current.delete(id);
            }, 1000);

            scenarioTimeouts.current.set(id, timeout);
            return updated;
        });
    }, [updateScenario]);
    
    const handleQuickReplyChange = useCallback((id: string, lang: 'fi' | 'en', value: string) => {
        // Update local state immediately
        setLocalQuickReplies(prev => {
            const updated = prev.map(qr => 
                qr.id === id ? { ...qr, text: { ...qr.text, [lang]: value } } : qr
            );

            // Clear existing timeout for this quick reply
            const existingTimeout = quickReplyTimeouts.current.get(`${id}-${lang}`);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            // Set new timeout with updated value
            const timeout = setTimeout(() => {
                const reply = updated.find(qr => qr.id === id);
                if (reply) {
                    updateQuickReply({ 
                        ...reply, 
                        text: { ...reply.text, [lang]: value } 
                    });
                }
                quickReplyTimeouts.current.delete(`${id}-${lang}`);
            }, 1000);

            quickReplyTimeouts.current.set(`${id}-${lang}`, timeout);
            return updated;
        });
    }, [updateQuickReply]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            scenarioTimeouts.current.forEach(timeout => clearTimeout(timeout));
            quickReplyTimeouts.current.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    const handleQuickReplyIconChange = (id: string, value: IconName) => {
        const reply = personality.quickReplies.find(qr => qr.id === id);
        if (reply) {
            updateQuickReply({ ...reply, icon: value });
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Smile className="w-6 h-6" /> {t('pers.title')}</h3>

            <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('pers.basic')}</h4>
                
                {/* Tone and Custom Instruction */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium mb-1" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('pers.tone')}</label>
                        <select 
                            id="tone" 
                            value={personality.tone} 
                            onChange={(e) => updateSettings({ tone: e.target.value as any })} 
                            className="w-full md:w-1/2 px-3 py-2 rounded-md border"
                            style={{
                                backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                color: 'var(--admin-text-primary, #f3f4f6)',
                                borderColor: 'var(--admin-border, #374151)'
                            }}
                        >
                            <option>Ystävällinen</option>
                            <option>Ammattimainen</option>
                            <option>Rento</option>
                            <option>Asiantunteva</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="customInstruction" className="block text-sm font-medium mb-1" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('pers.instruction')}</label>
                        <textarea 
                            id="customInstruction" 
                            rows={3} 
                            value={customInstruction} 
                            onChange={(e) => setCustomInstruction(e.target.value)} 
                            className="w-full px-3 py-2 rounded-md border" 
                            placeholder="Esim: Vastaa aina suomeksi. Älä ehdota kilpailevia tuotteita."
                            style={{
                                backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                color: 'var(--admin-text-primary, #f3f4f6)',
                                borderColor: 'var(--admin-border, #374151)'
                            }}
                        />
                    </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('pers.opening')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs uppercase font-bold tracking-wider mb-1 block" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>Suomi (FI)</span>
                            <input 
                                type="text" 
                                value={openingMessageFi} 
                                onChange={(e) => setOpeningMessageFi(e.target.value)} 
                                className="w-full px-3 py-2 rounded-md border" 
                                placeholder="Hei! Miten voin auttaa?"
                                style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    color: 'var(--admin-text-primary, #f3f4f6)',
                                    borderColor: 'var(--admin-border, #374151)'
                                }}
                            />
                        </div>
                        <div>
                            <span className="text-xs uppercase font-bold tracking-wider mb-1 block" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>English (EN)</span>
                            <input 
                                type="text" 
                                value={openingMessageEn} 
                                onChange={(e) => setOpeningMessageEn(e.target.value)} 
                                className="w-full px-3 py-2 rounded-md border" 
                                placeholder="Hello! How can I help you?"
                                style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    color: 'var(--admin-text-primary, #f3f4f6)',
                                    borderColor: 'var(--admin-border, #374151)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                 <div className="flex justify-between items-center">
                    <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('pers.quick_replies')}</h4>
                    <button 
                        onClick={addQuickReply} 
                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                        }}
                    >
                        <Plus className="w-4 h-4"/> {t('pers.add_reply')}
                    </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('pers.replies_desc')}</p>
                <div className="space-y-3">
                    {localQuickReplies.map(qr => {
                        const Icon = getIconComponent(qr.icon);
                        return (
                             <div key={qr.id} className="p-3 rounded-lg border flex flex-col md:flex-row gap-3 items-start md:items-center" style={{
                                 backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                 borderColor: 'var(--admin-border, #374151)'
                             }}>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <IconSelector 
                                        value={qr.icon} 
                                        onChange={(value) => handleQuickReplyIconChange(qr.id, value)} 
                                    />
                                </div>
                                
                                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold w-6" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>FI</span>
                                        <input 
                                            type="text" 
                                            value={qr.text.fi} 
                                            onChange={(e) => handleQuickReplyChange(qr.id, 'fi', e.target.value)} 
                                            className="w-full px-3 py-1.5 rounded-md text-sm border" 
                                            placeholder="Kysymys suomeksi"
                                            style={{
                                                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                                                color: 'var(--admin-text-primary, #f3f4f6)',
                                                borderColor: 'var(--admin-border, #374151)'
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold w-6" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>EN</span>
                                        <input 
                                            type="text" 
                                            value={qr.text.en} 
                                            onChange={(e) => handleQuickReplyChange(qr.id, 'en', e.target.value)} 
                                            className="w-full px-3 py-1.5 rounded-md text-sm border" 
                                            placeholder="Question in English"
                                            style={{
                                                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                                                color: 'var(--admin-text-primary, #f3f4f6)',
                                                borderColor: 'var(--admin-border, #374151)'
                                            }}
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={() => deleteQuickReply(qr.id)} 
                                    className="p-2 rounded-full self-end md:self-center transition-colors"
                                    style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                    }}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                 <div className="flex justify-between items-center">
                    <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('pers.scenarios')}</h4>
                    <button 
                        onClick={addScenario} 
                        className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md transition-colors"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                        }}
                    >
                        <Plus className="w-4 h-4"/> {t('pers.add_scenario')}
                    </button>
                </div>
                <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('pers.scenarios_desc')}</p>
                <div className="space-y-4">
                    {localScenarios.map(s => (
                        <div key={s.id} className="p-4 rounded-lg border" style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}>
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => deleteScenario(s.id)} 
                                    className="p-1 rounded-full transition-colors"
                                    style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                    }}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('pers.customer_says')}</label>
                                    <input 
                                        type="text" 
                                        value={s.userMessage} 
                                        onChange={e => handleScenarioChange(s.id, 'userMessage', e.target.value)} 
                                        className="w-full mt-1 px-3 py-2 rounded-md text-sm border"
                                        style={{
                                            backgroundColor: 'var(--admin-card-bg, #1f2937)',
                                            color: 'var(--admin-text-primary, #f3f4f6)',
                                            borderColor: 'var(--admin-border, #374151)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('pers.bot_says')}</label>
                                    <textarea 
                                        rows={2} 
                                        value={s.botResponse} 
                                        onChange={e => handleScenarioChange(s.id, 'botResponse', e.target.value)} 
                                        className="w-full mt-1 px-3 py-2 rounded-md text-sm border"
                                        style={{
                                            backgroundColor: 'var(--admin-card-bg, #1f2937)',
                                            color: 'var(--admin-text-primary, #f3f4f6)',
                                            borderColor: 'var(--admin-border, #374151)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PersonalitySettings;
