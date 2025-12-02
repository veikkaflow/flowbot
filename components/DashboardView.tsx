
import React from 'react';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { formatConversationListTime } from '../utils/time.ts';
import { MessageSquare, Archive, Palette, Smile, Users } from './Icons.tsx';
import { AdminView as AdminViewType, SettingsView } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface DashboardViewProps {
    onSwitchView: (view: AdminViewType, settingsView?: SettingsView) => void;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-4 border border-gray-700">
        <div className="p-3 bg-gray-700 rounded-full flex-shrink-0">
            <Icon className="w-6 h-6 text-gray-300" />
        </div>
        <div className="min-w-0">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 break-words">{title}</p>
        </div>
    </div>
);

const ActionCard: React.FC<{ title: string; description: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; onClick: () => void }> = ({ title, description, icon: Icon, onClick }) => (
    <button onClick={onClick} className="bg-gray-800 p-4 rounded-lg text-left w-full h-full flex flex-col hover:bg-gray-700 border border-gray-700 transition-colors">
        <div className="w-10 h-10 bg-gray-900 rounded-full self-start mb-3 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-sm text-gray-400 mt-1 flex-grow">{description}</p>
    </button>
);

const DashboardView: React.FC<DashboardViewProps> = ({ onSwitchView }) => {
    const { conversations, setActiveConversationId } = useConversationContext();
    const { activeBot } = useBotContext();
    const { t } = useLanguage();

    const stats = {
        total: conversations.length,
        active: conversations.filter(c => !c.isEnded).length,
        unread: conversations.filter(c => !c.isRead && !c.isEnded).length,
        ended: conversations.filter(c => c.isEnded).length
    };

    const recentConversations = [...conversations]
        .sort((a, b) => new Date(b.messages[b.messages.length - 1]?.timestamp || 0).getTime() - new Date(a.messages[a.messages.length - 1]?.timestamp || 0).getTime())
        .slice(0, 5);

    const handleConversationClick = (id: string) => {
        onSwitchView('inbox');
        setTimeout(() => setActiveConversationId(id), 50); // Allow view to switch first
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold text-white">{t('dash.welcome')}, {activeBot?.name || 'Admin'}!</h2>
                <p className="text-gray-400">{t('dash.overview')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t('dash.total')} value={stats.total} icon={MessageSquare} />
                <StatCard title={t('dash.active')} value={stats.active} icon={MessageSquare} />
                <StatCard title={t('dash.unread')} value={stats.unread} icon={MessageSquare} />
                <StatCard title={t('dash.ended')} value={stats.ended} icon={Archive} />
            </div>
            
            <div>
                 <h3 className="text-lg font-semibold text-white mb-3">{t('dash.main_actions')}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ActionCard title={t('dash.action.appearance')} description={t('dash.action.appearance_desc')} icon={Palette} onClick={() => onSwitchView('settings', 'appearance')} />
                    <ActionCard title={t('dash.action.personality')} description={t('dash.action.personality_desc')} icon={Smile} onClick={() => onSwitchView('settings', 'personality')} />
                    <ActionCard title={t('dash.action.agents')} description={t('dash.action.agents_desc')} icon={Users} onClick={() => onSwitchView('settings', 'agents')} />
                 </div>
            </div>

            <div className="flex-grow bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                <h3 className="text-lg font-semibold text-white p-4 border-b border-gray-700">{t('dash.recent')}</h3>
                <div className="overflow-y-auto">
                    {recentConversations.length > 0 ? (
                        recentConversations.map(conv => (
                            <button key={conv.id} onClick={() => handleConversationClick(conv.id)} className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700/50 border-b border-gray-700/50 last:border-b-0">
                                <div>
                                    <p className="font-semibold text-white">{conv.visitorName}</p>
                                    <p className="text-sm text-gray-400 truncate max-w-md">{conv.messages[conv.messages.length - 1]?.text}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                     <p className="text-xs text-gray-500">{formatConversationListTime(conv.messages[conv.messages.length - 1]?.timestamp)}</p>
                                     {!conv.isRead && !conv.isEnded && <span className="mt-1 inline-block px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">{t('dash.new_badge')}</span>}
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="p-4 text-sm text-gray-500 text-center">{t('dash.no_recent')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
