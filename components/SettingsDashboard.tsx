
import React, { useState, useEffect, useRef } from 'react';
import { SettingsView } from '../types.ts';
import { Palette, Smile, Shield, Book, Clock, Users, User as UserIcon, Settings as BehaviorIcon, Zap } from './Icons.tsx';
import AppearanceSettings from './AppearanceSettings.tsx';
import PersonalitySettings from './PersonalitySettings.tsx';
import KnowledgeBaseSettings from './KnowledgeBaseSettings.tsx';
import ScheduleSettings from './ScheduleSettings.tsx';
import AgentSettings from './AgentSettings.tsx';
import AvatarSettings from './AvatarSettings.tsx';
import BehaviorSettings from './BehaviorSettings.tsx';
import UserManagementSettings from './UserManagementSettings.tsx';
import InstallationSettings from './InstallationSettings.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface SettingsDashboardProps {
    initialView?: SettingsView;
}

const SettingsDashboard: React.FC<SettingsDashboardProps> = ({ initialView = 'appearance' }) => {
    const [currentView, setCurrentView] = useState<SettingsView>(initialView);
    const { t } = useLanguage();
    const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const menuItems = [
        { id: 'appearance', label: t('settings.appearance'), icon: Palette },
        { id: 'personality', label: t('settings.personality'), icon: Smile },
        { id: 'behavior', label: t('settings.behavior'), icon: BehaviorIcon },
        { id: 'knowledge', label: t('settings.knowledge'), icon: Book },
        { id: 'schedule', label: t('settings.schedule'), icon: Clock },
        { id: 'agents', label: t('settings.agents'), icon: Users },
        { id: 'avatars', label: t('settings.avatars'), icon: UserIcon },
        { id: 'users', label: t('settings.users'), icon: Shield },
        { id: 'installation', label: t('settings.installation'), icon: Zap },
    ];

    // Palauta kaikkien nappien tyylit oikeaan tilaan, kun currentView muuttuu
    useEffect(() => {
        menuItems.forEach(item => {
            const button = buttonRefs.current[item.id];
            if (button) {
                if (currentView === item.id) {
                    button.style.backgroundColor = 'var(--color-primary)';
                    button.style.color = 'black';
                    button.style.opacity = '1';
                } else {
                    button.style.backgroundColor = 'transparent';
                    button.style.color = 'var(--admin-text-secondary, #d1d5db)';
                    button.style.opacity = '1';
                }
            }
        });
    }, [currentView]);

    const renderContent = () => {
        switch (currentView) {
            case 'appearance': return <AppearanceSettings />;
            case 'personality': return <PersonalitySettings />;
            case 'knowledge': return <KnowledgeBaseSettings />;
            case 'schedule': return <ScheduleSettings />;
            case 'agents': return <AgentSettings />;
            case 'avatars': return <AvatarSettings />;
            case 'behavior': return <BehaviorSettings />;
            case 'users': return <UserManagementSettings />;
            case 'installation': return <InstallationSettings />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            <aside className="flex-shrink-0 md:w-64">
                 <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('settings.title')}</h2>
                <nav className="flex flex-col space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            ref={(el) => { buttonRefs.current[item.id] = el; }}
                            onClick={() => setCurrentView(item.id as SettingsView)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left"
                            style={{
                                backgroundColor: currentView === item.id ? 'var(--color-primary)' : 'transparent',
                                color: currentView === item.id 
                                    ? 'black' 
                                    : 'var(--admin-text-secondary, #d1d5db)',
                                opacity: '1'
                            }}
                            onMouseEnter={(e) => {
                                if (currentView !== item.id) {
                                    e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #374151)';
                                    e.currentTarget.style.opacity = '0.5';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentView !== item.id) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.opacity = '1';
                                }
                            }}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default SettingsDashboard;
