
import React, { useRef, useState } from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { User, Bot as BotIcon, UserCheck, UploadCloud, Plus } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { uploadAvatarImage } from '../services/imageStorageService.ts';

const AvatarGallery: React.FC<{
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    gallery: string[];
    selected: string;
    onSelect: (avatarUrl: string) => void;
}> = ({ title, icon: Icon, gallery, selected, onSelect }) => (
    <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
            <Icon className="w-5 h-5" /> {title}
        </h4>
        <div className="flex flex-wrap gap-3">
            {gallery.map(avatar => (
                <button
                    key={avatar}
                    onClick={() => onSelect(avatar)}
                    className="w-16 h-16 p-1 rounded-full ring-2 transition-all"
                    style={{
                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                        borderColor: selected === avatar ? 'var(--color-primary)' : 'transparent',
                        boxShadow: selected === avatar ? '0 0 0 2px var(--admin-card-bg, #1f2937), 0 0 0 4px var(--color-primary)' : 'none',
                        transform: selected === avatar ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                        if (selected !== avatar) {
                            e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selected !== avatar) {
                            e.currentTarget.style.borderColor = 'transparent';
                        }
                    }}
                >
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                </button>
            ))}
        </div>
    </div>
);

const AvatarSettings: React.FC = () => {
    const { settings: avatarSettings, updateSettings } = useSettings('avatarSettings');
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const { activeBot } = useBotContext();
    const agentAvatarUploadRef = useRef<HTMLInputElement>(null);
    const botAvatarUploadRef = useRef<HTMLInputElement>(null);
    const userAvatarUploadRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    
    if (!avatarSettings) return null;

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'agent' | 'bot' | 'user') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!activeBot?.id) {
            addNotification({ message: 'Botti ei ole valittu. Valitse botti ensin.', type: 'error' });
            e.target.value = '';
            return;
        }

        setUploading(type);
        
        try {
            // Upload to Firebase Storage
            const downloadURL = await uploadAvatarImage(file, activeBot.id, type);
            
            // Update settings with the Firebase Storage URL
            const galleryKey = `${type}AvatarGallery` as keyof typeof avatarSettings;
            const selectedKey = `selected${type.charAt(0).toUpperCase() + type.slice(1)}Avatar` as keyof typeof avatarSettings;
            const newGallery = [...(avatarSettings[galleryKey] as string[]), downloadURL];
            await updateSettings({ 
                [galleryKey]: newGallery, 
                [selectedKey]: downloadURL 
            });
            
            addNotification({ message: `${type}-avatari ladattu onnistuneesti Firebase Storageen.`, type: 'success' });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            addNotification({ message: `${type}-avataria ei voitu ladata.`, type: 'error' });
        } finally {
            setUploading(null);
            // Reset the input so the same file can be uploaded again if needed
            e.target.value = '';
        }
    };

    const handleAddAvatarFromUrl = (type: 'agent' | 'bot' | 'user') => {
        const url = prompt("Liitä kuvan URL-osoite:");
        if (url) {
            const galleryKey = `${type}AvatarGallery` as keyof typeof avatarSettings;
            const selectedKey = `selected${type.charAt(0).toUpperCase() + type.slice(1)}Avatar` as keyof typeof avatarSettings;
            const newGallery = [...(avatarSettings[galleryKey] as string[]), url];
            updateSettings({ 
                [galleryKey]: newGallery, 
                [selectedKey]: url 
            });
        }
    };

    return (
        <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><User className="w-6 h-6" /> {t('avatar.title')}</h3>

            <div className="p-6 rounded-lg border space-y-6" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <div className="border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}></div>
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                            <UserCheck className="w-5 h-5" /> {t('avatar.customer_title')}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {avatarSettings.userAvatarGallery.map(avatar => (
                                <button
                                    key={avatar}
                                    onClick={() => updateSettings({ selectedUserAvatar: avatar })}
                                    className="w-16 h-16 p-1 rounded-full ring-2 transition-all"
                                    style={{
                                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                        transform: avatarSettings.selectedUserAvatar === avatar ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: avatarSettings.selectedUserAvatar === avatar ? '0 0 0 2px var(--admin-card-bg, #1f2937), 0 0 0 4px var(--color-primary)' : 'none',
                                        borderColor: avatarSettings.selectedUserAvatar === avatar ? 'var(--color-primary)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (avatarSettings.selectedUserAvatar !== avatar) {
                                            e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (avatarSettings.selectedUserAvatar !== avatar) {
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }
                                    }}
                                >
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                </button>
                            ))}
                            <input type="file" ref={userAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'user')} accept="image/*" className="hidden" disabled={uploading === 'user'} />
                            <button 
                                onClick={() => userAvatarUploadRef.current?.click()} 
                                disabled={uploading === 'user'}
                                className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    borderColor: 'var(--admin-border, #374151)',
                                    color: 'var(--admin-text-secondary, #d1d5db)'
                                }}
                                onMouseEnter={(e) => {
                                    if (uploading !== 'user') {
                                        e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--admin-border, #374151)';
                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                }}
                            >
                                {uploading === 'user' ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UploadCloud className="w-5 h-5" />
                                        <span className="text-xs mt-0.5">{t('appr.upload')}</span>
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => handleAddAvatarFromUrl('user')} 
                                className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors"
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
                                <Plus className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.add_url')}</span>
                            </button>
                        </div>
                    </div>
                <div className="border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}></div>
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                            <UserCheck className="w-5 h-5" /> {t('avatar.bot_title')}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {avatarSettings.botAvatarGallery.map(avatar => (
                                <button
                                    key={avatar}
                                    onClick={() => updateSettings({ selectedBotAvatar: avatar })}
                                    className="w-16 h-16 p-1 rounded-full ring-2 transition-all"
                                    style={{
                                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                        transform: avatarSettings.selectedBotAvatar === avatar ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: avatarSettings.selectedBotAvatar === avatar ? '0 0 0 2px var(--admin-card-bg, #1f2937), 0 0 0 4px var(--color-primary)' : 'none',
                                        borderColor: avatarSettings.selectedBotAvatar === avatar ? 'var(--color-primary)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (avatarSettings.selectedBotAvatar !== avatar) {
                                            e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (avatarSettings.selectedBotAvatar !== avatar) {
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }
                                    }}
                                >
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                </button>
                            ))}
                            <input type="file" ref={botAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'bot')} accept="image/*" className="hidden" disabled={uploading === 'bot'} />
                            <button 
                                onClick={() => botAvatarUploadRef.current?.click()} 
                                disabled={uploading === 'bot'}
                                className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    borderColor: 'var(--admin-border, #374151)',
                                    color: 'var(--admin-text-secondary, #d1d5db)'
                                }}
                                onMouseEnter={(e) => {
                                    if (uploading !== 'bot') {
                                        e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--admin-border, #374151)';
                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                }}
                            >
                                {uploading === 'bot' ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UploadCloud className="w-5 h-5" />
                                        <span className="text-xs mt-0.5">{t('appr.upload')}</span>
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => handleAddAvatarFromUrl('bot')} 
                                className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors"
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
                                <Plus className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.add_url')}</span>
                            </button>
                        </div>
                    </div>
                <div className="border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}></div>
                    <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                            <UserCheck className="w-5 h-5" /> {t('avatar.agent_title')}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {avatarSettings.agentAvatarGallery.map(avatar => (
                                <button
                                    key={avatar}
                                    onClick={() => updateSettings({ selectedAgentAvatar: avatar })}
                                    className="w-16 h-16 p-1 rounded-full ring-2 transition-all"
                                    style={{
                                        backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                        transform: avatarSettings.selectedAgentAvatar === avatar ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: avatarSettings.selectedAgentAvatar === avatar ? '0 0 0 2px var(--admin-card-bg, #1f2937), 0 0 0 4px var(--color-primary)' : 'none',
                                        borderColor: avatarSettings.selectedAgentAvatar === avatar ? 'var(--color-primary)' : 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (avatarSettings.selectedAgentAvatar !== avatar) {
                                            e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (avatarSettings.selectedAgentAvatar !== avatar) {
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }
                                    }}
                                >
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                </button>
                            ))}
                            <input type="file" ref={agentAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'agent')} accept="image/*" className="hidden" disabled={uploading === 'agent'} />
                            <button 
                                onClick={() => agentAvatarUploadRef.current?.click()} 
                                disabled={uploading === 'agent'}
                                className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    borderColor: 'var(--admin-border, #374151)',
                                    color: 'var(--admin-text-secondary, #d1d5db)'
                                }}
                                onMouseEnter={(e) => {
                                    if (uploading !== 'agent') {
                                        e.currentTarget.style.borderColor = 'var(--admin-text-secondary, #d1d5db)';
                                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--admin-border, #374151)';
                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                }}
                            >
                                {uploading === 'agent' ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UploadCloud className="w-5 h-5" />
                                        <span className="text-xs mt-0.5">{t('appr.upload')}</span>
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => handleAddAvatarFromUrl('agent')} 
                                className="w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors"
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
                                <Plus className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.add_url')}</span>
                            </button>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default AvatarSettings;
