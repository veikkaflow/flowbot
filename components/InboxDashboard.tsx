
// components/InboxDashboard.tsx
import React, { useCallback } from 'react';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import ConversationList from './ConversationList.tsx';
import ConversationDetail from './ConversationDetail.tsx';
import { Mail, Loader } from './Icons.tsx';
import { Message } from '../types.ts';
import { generateId } from '../utils/id.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

const InboxDashboard: React.FC = () => {
    const { 
        conversations, 
        activeConversation, 
        setActiveConversationId,
        addMessage
    } = useConversationContext();

    const { activeBot } = useBotContext();
    const { t } = useLanguage();

    const handleSendMessage = useCallback(async (text: string) => {
        if (!activeConversation || !activeBot) return;

        const assignedAgent = activeBot.settings.agents.find(a => a.id === activeConversation.agentId);
        if (!assignedAgent) return;

        const agentMessage: Message = {
            id: generateId(),
            text,
            sender: 'agent',
            timestamp: new Date().toISOString()
        };
        
        await addMessage(
            activeConversation.visitorId, 
            agentMessage
        );
    }, [activeConversation, activeBot, addMessage]);
    
    if (!activeBot || !activeBot.settings || !activeBot.settings.avatarSettings) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-900">
                <Loader className="w-8 h-8 animate-spin text-gray-500"/>
            </div>
        );
    }
    
    const { avatarSettings } = activeBot.settings;

    return (
        <div className="h-full flex">
            <div className="w-1/3 min-w-[300px] max-w-[400px]">
                <ConversationList
                    conversations={conversations}
                    activeConversationId={activeConversation?.id || null}
                    onSelectConversation={setActiveConversationId}
                />
            </div>
            <div className="flex-1">
                {activeConversation ? (
                    <ConversationDetail
                        conversation={activeConversation}
                        avatars={avatarSettings}
                        onSendMessage={handleSendMessage}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500">
                        <Mail className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold">{t('inbox.select_conversation')}</h3>
                        <p>{t('inbox.select_desc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxDashboard;
