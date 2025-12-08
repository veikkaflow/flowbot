
import React, { useRef } from 'react';
import { useSettings } from '../hooks/useSettings.ts';
import { User, Bot as BotIcon, UserCheck, UploadCloud, Plus } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';

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
    const agentAvatarUploadRef = useRef<HTMLInputElement>(null);
    const botAvatarUploadRef = useRef<HTMLInputElement>(null);
    const userAvatarUploadRef = useRef<HTMLInputElement>(null);
    if (!avatarSettings) return null;

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'agent' | 'bot' | 'user') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const galleryKey = `${type}AvatarGallery` as keyof typeof avatarSettings;
                const selectedKey = `selected${type.charAt(0).toUpperCase() + type.slice(1)}Avatar` as keyof typeof avatarSettings;
                const newGallery = [...(avatarSettings[galleryKey] as string[]), base64String];
                updateSettings({ 
                    [galleryKey]: newGallery, 
                    [selectedKey]: base64String 
                });
                addNotification({ message: `${type}-avatari ladattu onnistuneesti.`, type: 'success' });
                // Reset the input so the same file can be uploaded again if needed
                e.target.value = '';
            };
            reader.onerror = () => {
                addNotification({ message: `${type}-avataria ei voitu ladata.`, type: 'error' });
                e.target.value = '';
            };
            reader.readAsDataURL(file);
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
                            <input type="file" ref={userAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'user')} accept="image/*" className="hidden" />
                            <button 
                                onClick={() => userAvatarUploadRef.current?.click()} 
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
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.upload')}</span>
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
                            <input type="file" ref={botAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'bot')} accept="image/*" className="hidden" />
                            <button 
                                onClick={() => botAvatarUploadRef.current?.click()} 
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
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.upload')}</span>
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
                            <input type="file" ref={agentAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'agent')} accept="image/*" className="hidden" />
                            <button 
                                onClick={() => agentAvatarUploadRef.current?.click()} 
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
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.upload')}</span>
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
