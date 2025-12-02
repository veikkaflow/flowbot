
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
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Icon className="w-5 h-5" /> {title}
        </h4>
        <div className="flex flex-wrap gap-3">
            {gallery.map(avatar => (
                <button
                    key={avatar}
                    onClick={() => onSelect(avatar)}
                    className={`w-16 h-16 p-1 rounded-full bg-gray-700 ring-2 transition-all ${selected === avatar ? 'ring-offset-2 ring-offset-gray-800 ring-[var(--color-primary)] scale-110' : 'ring-transparent hover:ring-gray-500'}`}
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
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><User className="w-6 h-6" /> {t('avatar.title')}</h3>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-6">
                <div className="border-t border-gray-700"></div>
                    <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <UserCheck className="w-5 h-5" /> {t('avatar.customer_title')}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {avatarSettings.userAvatarGallery.map(avatar => (
                                <button
                                    key={avatar}
                                    onClick={() => updateSettings({ selectedUserAvatar: avatar })}
                                    className={`w-16 h-16 p-1 rounded-full bg-gray-700 ring-2 transition-all ${avatarSettings.selectedUserAvatar === avatar ? 'ring-offset-2 ring-offset-gray-800 ring-[var(--color-primary)] scale-110' : 'ring-transparent hover:ring-gray-500'}`}
                                >
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                </button>
                            ))}
                            <input type="file" ref={userAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'user')} accept="image/*" className="hidden" />
                            <button onClick={() => userAvatarUploadRef.current?.click()} className="w-16 h-16 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.upload')}</span>
                            </button>
                            <button onClick={() =>handleAddAvatarFromUrl('bot')} className="w-16 h-16 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
                                <Plus className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.add_url')}</span>
                            </button>
                        </div>
                    </div>
                <div className="border-t border-gray-700"></div>
                    <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <UserCheck className="w-5 h-5" /> {t('avatar.bot_title')}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {avatarSettings.botAvatarGallery.map(avatar => (
                                <button
                                    key={avatar}
                                    onClick={() => updateSettings({ selectedBotAvatar: avatar })}
                                    className={`w-16 h-16 p-1 rounded-full bg-gray-700 ring-2 transition-all ${avatarSettings.selectedBotAvatar === avatar ? 'ring-offset-2 ring-offset-gray-800 ring-[var(--color-primary)] scale-110' : 'ring-transparent hover:ring-gray-500'}`}
                                >
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                </button>
                            ))}
                            <input type="file" ref={botAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'bot')} accept="image/*" className="hidden" />
                            <button onClick={() => botAvatarUploadRef.current?.click()} className="w-16 h-16 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.upload')}</span>
                            </button>
                            <button onClick={() =>handleAddAvatarFromUrl('bot')} className="w-16 h-16 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
                                <Plus className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.add_url')}</span>
                            </button>
                        </div>
                    </div>
                <div className="border-t border-gray-700"></div>
                    <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <UserCheck className="w-5 h-5" /> {t('avatar.agent_title')}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {avatarSettings.agentAvatarGallery.map(avatar => (
                                <button
                                    key={avatar}
                                    onClick={() => updateSettings({ selectedAgentAvatar: avatar })}
                                    className={`w-16 h-16 p-1 rounded-full bg-gray-700 ring-2 transition-all ${avatarSettings.selectedAgentAvatar === avatar ? 'ring-offset-2 ring-offset-gray-800 ring-[var(--color-primary)] scale-110' : 'ring-transparent hover:ring-gray-500'}`}
                                >
                                    <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                                </button>
                            ))}
                            <input type="file" ref={agentAvatarUploadRef} onChange={(e) => handleAvatarUpload(e, 'agent')} accept="image/*" className="hidden" />
                            <button onClick={() => agentAvatarUploadRef.current?.click()} className="w-16 h-16 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-xs mt-0.5">{t('appr.upload')}</span>
                            </button>
                            <button onClick={() => handleAddAvatarFromUrl('agent')} className="w-16 h-16 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500">
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
