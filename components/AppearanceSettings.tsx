
// components/AppearanceSettings.tsx
import React, { useRef, useCallback } from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { useNotification } from '../context/NotificationContext.tsx';
import { Palette, Image, UploadCloud, Plus, Monitor } from './Icons.tsx';
import { BackgroundAnimation as AnimationType } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useDebouncedSave } from '../hooks/useDebouncedSave.ts';

const ColorPicker: React.FC<{ label: string; color: string; onChange: (color: string) => void; }> = ({ label, color, onChange }) => {
    const [localColor, setLocalColor, isSaving] = useDebouncedSave(
        color,
        (value) => onChange(value),
        500 // Shorter debounce for colors
    );

    return (
        <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{label}</label>
            <div className="flex items-center gap-2">
                <input 
                    type="color" 
                    value={localColor} 
                    onChange={(e) => {
                        setLocalColor(e.target.value);
                        onChange(e.target.value); // Immediate update for color picker
                    }} 
                    className="p-1 h-10 w-10 block cursor-pointer rounded-lg border" 
                    style={{
                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                        borderColor: 'var(--admin-border, #374151)'
                    }}
                />
                <input 
                    type="text" 
                    value={localColor} 
                    onChange={(e) => setLocalColor(e.target.value)} 
                    className="w-full px-3 py-2 rounded-md border" 
                    style={{
                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                        color: 'var(--admin-text-primary, #f3f4f6)',
                        borderColor: 'var(--admin-border, #374151)'
                    }}
                />
            </div>
        </div>
    );
};

// Memoized AnimationCard - renderöidään uudelleen vain jos propsit muuttuvat
const AnimationCard: React.FC<{ name: string; type: AnimationType; selected: AnimationType; onSelect: (type: AnimationType) => void; }> = React.memo(({ name, type, selected, onSelect }) => {
    // Memoize click handler
    const handleClick = useCallback(() => {
        onSelect(type);
    }, [type, onSelect]);

    // Renderöi aina vain staattinen CSS-esikatselu
    const renderPreview = () => {
        return (
            <div className="anim-preview-container">
                {type === 'aurora' && <div className="anim-preview-aurora"></div>}
                {type === 'waves' && <div className="anim-preview-waves"></div>}
                {type === 'geometric' && (
                    <div className="anim-preview-geometric">
                        <div></div>
                    </div>
                )}
                {type === 'gradient' && <div className="anim-preview-gradient"></div>}
                {type === 'particles' && (
                    <div className="anim-preview-particles">
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                )}
                {type === 'pulse' && (
                    <div className="anim-preview-pulse">
                        <div></div>
                    </div>
                )}
                {type === 'mesh' && <div className="anim-preview-mesh"></div>}
                {type === 'none' && <div style={{ backgroundColor: 'var(--admin-sidebar-bg, #374151)', opacity: 0.5 }}></div>}
            </div>
        );
    };

    return (
        <button 
            onClick={handleClick}
            className="relative w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all"
            style={{
                borderColor: selected === type ? 'var(--color-primary)' : 'var(--admin-border, #374151)'
            }}
            onMouseEnter={(e) => {
                if (selected !== type) {
                    e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                }
            }}
            onMouseLeave={(e) => {
                if (selected !== type) {
                    e.currentTarget.style.borderColor = 'var(--admin-border, #374151)';
                }
            }}
        >
            {/* Renderöi aina vain staattinen esikatselu */}
            {renderPreview()}
            {/* Nimi näytetään päällä */}
            <div className="absolute inset-0 flex items-end justify-center p-3">
                <span className="font-semibold text-sm px-3 py-1 rounded backdrop-blur-sm" style={{
                    color: 'var(--admin-text-primary, #f3f4f6)',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}>{name}</span>
            </div>
        </button>
    );
});


const AppearanceSettings: React.FC = () => {
    const { settings: appearance, setSettings } = useSettings('appearance');
    const { addNotification } = useNotification();
    const logoUploadRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();
    
    // Debounced save for text inputs
    const [brandName, setBrandName, isSavingBrandName] = useDebouncedSave(
        appearance?.brandName,
        (value) => setSettings({ ...appearance!, brandName: value })
    );

    const [websiteUrl, setWebsiteUrl, isSavingWebsiteUrl] = useDebouncedSave(
        appearance?.websiteUrl,
        (value) => setSettings({ ...appearance!, websiteUrl: value })
    );
    
    if (!appearance) return null;

    // Memoize updateSettings - luodaan uudelleen vain jos appearance tai setSettings muuttuvat
    const updateSettings = useCallback((updates: Partial<typeof appearance>) => {
        setSettings({ ...appearance, ...updates });
    }, [appearance, setSettings]);

    // Memoize animation select handler - yksi funktio kaikille animaatioille
    const handleAnimationSelect = useCallback((type: AnimationType) => {
        updateSettings({ backgroundAnimation: type });
    }, [updateSettings]);
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const newGallery = [...appearance.logoGallery, base64String];
                updateSettings({ logoGallery: newGallery, brandLogo: base64String });
                addNotification({ message: 'Logo ladattu onnistuneesti.', type: 'success' });
            };
            reader.onerror = () => {
                addNotification({ message: 'Logoa ei voitu ladata.', type: 'error' });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddLogoFromUrl = () => {
        const url = prompt("Liitä kuvan URL-osoite:");
        if(url) {
            const newGallery = [...appearance.logoGallery, url];
            updateSettings({ logoGallery: newGallery, brandLogo: url });
        }
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Palette className="w-6 h-6" /> {t('appr.title')}</h3>
            
            <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('appr.branding')}</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="brandName" className="block text-sm font-medium mb-1" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('appr.brand_name')}</label>
                        <input 
                            type="text" 
                            id="brandName" 
                            value={brandName} 
                            onChange={(e) => setBrandName(e.target.value)} 
                            className="w-full px-3 py-2 rounded-md border"
                            style={{
                                backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                color: 'var(--admin-text-primary, #f3f4f6)',
                                borderColor: 'var(--admin-border, #374151)'
                            }}
                        />
                    </div>
                     <div>
                        <label htmlFor="websiteUrl" className="block text-sm font-medium mb-1" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('appr.website_url')}</label>
                        <input 
                            type="url" 
                            id="websiteUrl" 
                            value={websiteUrl || ''} 
                            onChange={(e) => setWebsiteUrl(e.target.value)} 
                            className="w-full px-3 py-2 rounded-md border"
                            style={{
                                backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                color: 'var(--admin-text-primary, #f3f4f6)',
                                borderColor: 'var(--admin-border, #374151)'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Monitor className="w-5 h-5"/> {t('appr.theme')}</h4>
                <div className="flex gap-4">
                    <button
                        onClick={() => updateSettings({ themeMode: 'light' })}
                        className="flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all"
                        style={{
                            borderColor: appearance.themeMode !== 'dark' ? 'var(--color-primary)' : 'var(--admin-border, #374151)',
                            backgroundColor: appearance.themeMode !== 'dark' ? 'var(--admin-sidebar-bg, #374151)' : 'var(--admin-card-bg, #1f2937)'
                        }}
                        onMouseEnter={(e) => {
                            if (appearance.themeMode === 'dark') {
                                e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (appearance.themeMode === 'dark') {
                                e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #1f2937)';
                            }
                        }}
                    >
                        <div className="w-full h-20 bg-white rounded flex flex-col p-2 border border-gray-200">
                             <div className="h-2 w-1/3 bg-gray-200 rounded mb-2"></div>
                             <div className="flex-1 bg-gray-50 rounded"></div>
                        </div>
                        <span className="text-sm font-medium" style={{ color: appearance.themeMode !== 'dark' ? 'var(--admin-text-primary, #f3f4f6)' : 'var(--admin-text-secondary, #d1d5db)' }}>{t('appr.theme_light')}</span>
                    </button>
                    <button
                        onClick={() => updateSettings({ themeMode: 'dark' })}
                        className="flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all"
                        style={{
                            borderColor: appearance.themeMode === 'dark' ? 'var(--color-primary)' : 'var(--admin-border, #374151)',
                            backgroundColor: appearance.themeMode === 'dark' ? 'var(--admin-sidebar-bg, #374151)' : 'var(--admin-card-bg, #1f2937)'
                        }}
                        onMouseEnter={(e) => {
                            if (appearance.themeMode !== 'dark') {
                                e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (appearance.themeMode !== 'dark') {
                                e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #1f2937)';
                            }
                        }}
                    >
                        <div className="w-full h-20 bg-gray-900 rounded flex flex-col p-2 border border-gray-700">
                             <div className="h-2 w-1/3 bg-gray-700 rounded mb-2"></div>
                             <div className="flex-1 bg-gray-800 rounded"></div>
                        </div>
                        <span className="text-sm font-medium" style={{ color: appearance.themeMode === 'dark' ? 'var(--admin-text-primary, #f3f4f6)' : 'var(--admin-text-secondary, #d1d5db)' }}>{t('appr.theme_dark')}</span>
                    </button>
                </div>
            </div>
            
            <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('appr.colors')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <ColorPicker label={t('appr.primary_color')} color={appearance.primaryColor} onChange={(c) => updateSettings({ primaryColor: c })} />
                    <ColorPicker label={t('appr.header_color')} color={appearance.headerColor} onChange={(c) => updateSettings({ headerColor: c })} />
                </div>
            </div>

            <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                 <h4 className="font-semibold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Image className="w-5 h-5"/> {t('appr.logos')}</h4>
                 <div className="flex flex-wrap gap-3">
                    {appearance.logoGallery.map((logo, index) => (
                         <button 
                            key={index} 
                            onClick={() => updateSettings({ brandLogo: logo })} 
                            className="w-20 h-20 p-2 rounded-lg transition-all"
                            style={{
                                backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                border: appearance.brandLogo === logo ? '2px solid var(--color-primary)' : '2px solid transparent',
                                boxShadow: appearance.brandLogo === logo ? '0 0 0 2px var(--admin-card-bg, #1f2937), 0 0 0 4px var(--color-primary)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (appearance.brandLogo !== logo) {
                                    e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (appearance.brandLogo !== logo) {
                                    e.currentTarget.style.borderColor = 'transparent';
                                }
                            }}
                        >
                            <img src={logo} alt="logo" className="w-full h-full object-contain" />
                        </button>
                    ))}
                     <input type="file" ref={logoUploadRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                     <button 
                        onClick={() => logoUploadRef.current?.click()} 
                        className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            borderColor: 'var(--admin-border, #374151)',
                            color: 'var(--admin-text-secondary, #d1d5db)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                            e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--admin-border, #374151)';
                            e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                        }}
                    >
                        <UploadCloud className="w-6 h-6" />
                        <span className="text-xs mt-1">{t('appr.upload')}</span>
                    </button>
                    <button 
                        onClick={handleAddLogoFromUrl} 
                        className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            borderColor: 'var(--admin-border, #374151)',
                            color: 'var(--admin-text-secondary, #d1d5db)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                            e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--admin-border, #374151)';
                            e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                        }}
                    >
                        <Plus className="w-6 h-6" />
                        <span className="text-xs mt-1">{t('appr.add_url')}</span>
                    </button>
                 </div>
            </div>

             <div className="p-6 rounded-lg border space-y-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <h4 className="font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('appr.bg_anim')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Käytetään samaa memoized handleria kaikille animaatioille */}
                    <AnimationCard name={t('appr.anim_none')} type="none" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                    <AnimationCard name={t('appr.anim_aurora')} type="aurora" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                    <AnimationCard name={t('appr.anim_waves')} type="waves" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                    <AnimationCard name={t('appr.anim_geometric')} type="geometric" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                    <AnimationCard name={t('appr.anim_gradient')} type="gradient" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                    <AnimationCard name={t('appr.anim_particles')} type="particles" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                    <AnimationCard name={t('appr.anim_pulse')} type="pulse" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                    <AnimationCard name={t('appr.anim_mesh')} type="mesh" selected={appearance.backgroundAnimation} onSelect={handleAnimationSelect} />
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;