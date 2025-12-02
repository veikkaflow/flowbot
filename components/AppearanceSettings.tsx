
// components/AppearanceSettings.tsx
import React, { useRef } from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { useNotification } from '../context/NotificationContext.tsx';
import { Palette, Image, UploadCloud, Plus, Monitor } from './Icons.tsx';
import BackgroundAnimation from './BackgroundAnimation.tsx';
import { BackgroundAnimation as AnimationType } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

const ColorPicker: React.FC<{ label: string; color: string; onChange: (color: string) => void; }> = ({ label, color, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="p-1 h-10 w-10 block bg-gray-700 border border-gray-600 cursor-pointer rounded-lg" />
            <input type="text" value={color} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" />
        </div>
    </div>
);

const AnimationCard: React.FC<{ name: string; type: AnimationType; selected: AnimationType; onSelect: (type: AnimationType) => void; }> = ({ name, type, selected, onSelect }) => (
    <button onClick={() => onSelect(type)} className={`relative w-full aspect-[4/3] rounded-lg border-2 overflow-hidden transition-all group ${selected === type ? 'border-[var(--color-primary)]' : 'border-gray-700 hover:border-gray-500'}`}>
        <div className="absolute inset-0">
            <BackgroundAnimation animation={type} />
        </div>
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2">
            {/* Chat widget mockup */}
            <div className="w-4/5 h-4/5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex flex-col">
                <div className="h-4 bg-white/30 rounded-t-md"></div>
                <div className="flex-grow p-2 space-y-1">
                    <div className="w-3/5 h-2 bg-white/20 rounded-full"></div>
                    <div className="w-4/5 h-2 bg-white/20 rounded-full ml-auto"></div>
                     <div className="w-1/2 h-2 bg-white/20 rounded-full"></div>
                </div>
            </div>
             <span className="font-semibold text-white text-sm mt-2">{name}</span>
        </div>
    </button>
);


const AppearanceSettings: React.FC = () => {
    const { settings: appearance, setSettings } = useSettings('appearance');
    const { addNotification } = useNotification();
    const logoUploadRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();
    
    if (!appearance) return null;

    const updateSettings = (updates: Partial<typeof appearance>) => {
        setSettings({ ...appearance, ...updates });
    };
    
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
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Palette className="w-6 h-6" /> {t('appr.title')}</h3>
            
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-semibold text-white">{t('appr.branding')}</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="brandName" className="block text-sm font-medium text-gray-300 mb-1">{t('appr.brand_name')}</label>
                        <input type="text" id="brandName" value={appearance.brandName} onChange={(e) => updateSettings({ brandName: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-300 mb-1">{t('appr.website_url')}</label>
                        <input type="url" id="websiteUrl" value={appearance.websiteUrl || ''} onChange={(e) => updateSettings({ websiteUrl: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"/>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-semibold text-white flex items-center gap-2"><Monitor className="w-5 h-5"/> {t('appr.theme')}</h4>
                <div className="flex gap-4">
                    <button
                        onClick={() => updateSettings({ themeMode: 'light' })}
                        className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                            appearance.themeMode !== 'dark' 
                                ? 'border-[var(--color-primary)] bg-gray-700' 
                                : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                        <div className="w-full h-20 bg-white rounded flex flex-col p-2 border border-gray-200">
                             <div className="h-2 w-1/3 bg-gray-200 rounded mb-2"></div>
                             <div className="flex-1 bg-gray-50 rounded"></div>
                        </div>
                        <span className={`text-sm font-medium ${appearance.themeMode !== 'dark' ? 'text-white' : 'text-gray-400'}`}>{t('appr.theme_light')}</span>
                    </button>
                    <button
                        onClick={() => updateSettings({ themeMode: 'dark' })}
                        className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                            appearance.themeMode === 'dark' 
                                ? 'border-[var(--color-primary)] bg-gray-700' 
                                : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                        <div className="w-full h-20 bg-gray-900 rounded flex flex-col p-2 border border-gray-700">
                             <div className="h-2 w-1/3 bg-gray-700 rounded mb-2"></div>
                             <div className="flex-1 bg-gray-800 rounded"></div>
                        </div>
                        <span className={`text-sm font-medium ${appearance.themeMode === 'dark' ? 'text-white' : 'text-gray-400'}`}>{t('appr.theme_dark')}</span>
                    </button>
                </div>
            </div>
            
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-semibold text-white">{t('appr.colors')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <ColorPicker label={t('appr.primary_color')} color={appearance.primaryColor} onChange={(c) => updateSettings({ primaryColor: c })} />
                    <ColorPicker label={t('appr.header_color')} color={appearance.headerColor} onChange={(c) => updateSettings({ headerColor: c })} />
                </div>
            </div>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                 <h4 className="font-semibold text-white flex items-center gap-2"><Image className="w-5 h-5"/> {t('appr.logos')}</h4>
                 <div className="flex flex-wrap gap-3">
                    {appearance.logoGallery.map((logo, index) => (
                         <button key={index} onClick={() => updateSettings({ brandLogo: logo })} className={`w-20 h-20 p-2 rounded-lg bg-gray-700 ring-2 transition-all ${appearance.brandLogo === logo ? 'ring-offset-2 ring-offset-gray-800 ring-[var(--color-primary)]' : 'ring-transparent hover:ring-gray-500'}`}>
                            <img src={logo} alt="logo" className="w-full h-full object-contain" />
                        </button>
                    ))}
                     <input type="file" ref={logoUploadRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                     <button onClick={() => logoUploadRef.current?.click()} className="w-20 h-20 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
                        <UploadCloud className="w-6 h-6" />
                        <span className="text-xs mt-1">{t('appr.upload')}</span>
                    </button>
                    <button onClick={handleAddLogoFromUrl} className="w-20 h-20 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
                        <Plus className="w-6 h-6" />
                        <span className="text-xs mt-1">{t('appr.add_url')}</span>
                    </button>
                 </div>
            </div>

             <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
                <h4 className="font-semibold text-white">{t('appr.bg_anim')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AnimationCard name={t('appr.anim_none')} type="none" selected={appearance.backgroundAnimation} onSelect={(type) => updateSettings({ backgroundAnimation: type })} />
                    <AnimationCard name={t('appr.anim_aurora')} type="aurora" selected={appearance.backgroundAnimation} onSelect={(type) => updateSettings({ backgroundAnimation: type })} />
                    <AnimationCard name={t('appr.anim_waves')} type="waves" selected={appearance.backgroundAnimation} onSelect={(type) => updateSettings({ backgroundAnimation: type })} />
                    <AnimationCard name={t('appr.anim_gradient')} type="gradient" selected={appearance.backgroundAnimation} onSelect={(type) => updateSettings({ backgroundAnimation: type })} />
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;