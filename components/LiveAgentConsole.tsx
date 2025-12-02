
import React, { useState, useEffect, useRef } from 'react';
// FIX: Replaced non-existent Avatars type with AvatarSettings.
import { Conversation, AvatarSettings, Agent } from '../types.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { Send, UserCheck, UserX, Archive, FileText, Loader, ArrowDown } from './Icons.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { getConversationSummary } from '../services/geminiService.ts';
import { isSameDay, formatDateSeparator } from '../utils/time.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface LiveAgentConsoleProps {
    conversation: Conversation;
    onSendMessage: (text: string) => void;
    avatars: AvatarSettings;
}

const DateSeparator: React.FC<{ timestamp: string }> = ({ timestamp }) => {
    const { language } = useLanguage();
    return (
        <div className="py-2 text-center">
            <span className="px-2 py-1 text-xs text-gray-400 bg-gray-800 rounded-full">{formatDateSeparator(timestamp, language)}</span>
        </div>
    );
};


const LiveAgentConsole: React.FC<LiveAgentConsoleProps> = ({ conversation, onSendMessage, avatars }) => {
    const [input, setInput] = useState('');
    const { activeBot } = useBotContext();
    const { markAgentJoined, agentLeaveConversation, archiveConversation } = useConversationContext();
    const { addNotification } = useNotification();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isJoinMenuOpen, setIsJoinMenuOpen] = useState(false);
    const { t } = useLanguage();
    
    const availableAgents = activeBot?.settings.agents || [];
    const assignedAgent = availableAgents.find(a => a.id === conversation.agentId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation.messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && assignedAgent) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleJoinAs = (agent: Agent) => {
        markAgentJoined(conversation.id, agent.id, agent.name);
        setIsJoinMenuOpen(false);
    };

    // Keep the simple join if only 1 agent, otherwise open menu
    const toggleJoinMenu = () => {
        if (availableAgents.length === 1) {
            handleJoinAs(availableAgents[0]);
        } else {
            setIsJoinMenuOpen(!isJoinMenuOpen);
        }
    };

    const handleLeave = () => {
        if (assignedAgent) {
            agentLeaveConversation(conversation.id, assignedAgent.name);
        }
    };
    
    const handleArchive = () => {
        archiveConversation(conversation.id);
    };

    const handleGetSummary = async () => {
        setIsSummarizing(true);
        try {
            const summary = await getConversationSummary(conversation);
            addNotification({
                message: `Yhteenveto: ${summary}`,
                type: 'info',
                duration: 15000,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            addNotification({ message: 'Yhteenvedon luonti epäonnistui.', type: 'error' });
        } finally {
            setIsSummarizing(false);
        }
    };

    const isInputDisabled = conversation.isEnded || !assignedAgent;

    const renderHeaderStatus = () => {
        if (conversation.isEnded) {
            return <p className="text-sm text-gray-400">Keskustelu päättynyt</p>;
        }
        if (assignedAgent) {
             return (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <img src={assignedAgent.avatar} alt={assignedAgent.name} className="w-8 h-8 rounded-full"/>
                    <span>{assignedAgent.name}</span>
                </div>
            );
        }
        return <p className="text-sm text-yellow-400">Odottaa agenttia</p>
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <header className="flex-shrink-0 p-4 border-b border-gray-700 flex items-center justify-between relative">
                <div>
                    <h3 className="text-lg font-semibold text-white">{conversation.visitorName || `Vieras ${conversation.visitorId.substring(0, 6)}`}</h3>
                    {renderHeaderStatus()}
                </div>
                <div className="flex items-center gap-4">
                    {!conversation.isEnded && (
                        <>
                            <button onClick={handleGetSummary} disabled={isSummarizing} title="Luo yhteenveto" className="p-2 text-gray-400 hover:text-white disabled:opacity-50">
                                {isSummarizing ? <Loader className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                            </button>
                             <button onClick={handleArchive} title="Arkistoi keskustelu" className="p-2 text-gray-400 hover:text-white">
                                <Archive className="w-5 h-5" />
                            </button>
                            {assignedAgent ? (
                                <button onClick={handleLeave} className="flex items-center gap-1.5 text-sm bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-md text-white">
                                    <UserX className="w-4 h-4"/> Poistu
                                </button>
                            ) : (
                                availableAgents.length > 0 && (
                                    <div className="relative">
                                        <button 
                                            onClick={toggleJoinMenu} 
                                            className="flex items-center gap-1 text-sm bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded-md text-white"
                                        >
                                            <UserCheck className="w-4 h-4" /> Liity
                                        </button>
                                        
                                        {isJoinMenuOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                                <div className="p-2 text-xs text-gray-400 border-b border-gray-700 font-semibold">{t('agent.select_to_join')}</div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {availableAgents.map(agent => (
                                                        <button 
                                                            key={agent.id}
                                                            onClick={() => handleJoinAs(agent)}
                                                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-700 text-left transition-colors"
                                                        >
                                                            <img src={agent.avatar} alt={agent.name} className="w-6 h-6 rounded-full"/>
                                                            <span className="text-sm text-gray-200">{agent.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                             )}
                        </>
                    )}
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {conversation.messages.length === 0 && (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        <p>Ei viestejä vielä.</p>
                    </div>
                )}
                {conversation.messages.map((msg, index) => {
                    const prevMsg = conversation.messages[index-1];
                    const showDateSeparator = !prevMsg || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));
                    const senderName = msg.sender === 'agent' ? assignedAgent?.name : (msg.sender === 'bot' ? 'Botti' : undefined);

                    return (
                        <React.Fragment key={msg.id}>
                            {showDateSeparator && <DateSeparator timestamp={msg.timestamp} />}
                            <MessageBubble message={msg} avatars={avatars} perspective="agent" senderName={senderName} />
                        </React.Fragment>
                    )
                })}
                 <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 p-4 bg-gray-800 border-t border-gray-700 relative">
                {!assignedAgent && !conversation.isEnded && (
                    <div>
                         {isJoinMenuOpen && availableAgents.length > 1 ? (
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 mb-2">
                                <p className="text-sm text-gray-400 mb-2 px-1">{t('agent.select_to_join')}:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableAgents.map(agent => (
                                        <button 
                                            key={agent.id}
                                            onClick={() => handleJoinAs(agent)}
                                            className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-left transition-all"
                                        >
                                            <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full"/>
                                            <span className="text-sm font-medium text-white">{agent.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setIsJoinMenuOpen(false)} className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-300">Peruuta</button>
                            </div>
                        ) : (
                            <button 
                                onClick={toggleJoinMenu} 
                                disabled={availableAgents.length === 0}
                                className="w-full flex items-center justify-center gap-2 text-base font-semibold bg-green-700 hover:bg-green-600 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                            >
                                <UserCheck className="w-5 h-5" /> 
                                {availableAgents.length > 1 ? t('agent.select_to_join') : "Liity keskusteluun"}
                            </button>
                        )}
                    </div>
                )}
                {assignedAgent && !conversation.isEnded && (
                    <form onSubmit={handleSubmit} className="flex items-center gap-4">
                        <textarea
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Kirjoita vastaus..."
                            className="w-full text-sm p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none text-white placeholder-gray-400"
                        />
                        <button type="submit" disabled={!input.trim()} className="p-3 text-white rounded-lg disabled:opacity-50 bg-[var(--color-primary)] hover:brightness-110">
                            <Send className="w-5 h-5"/>
                        </button>
                    </form>
                )}
                {conversation.isEnded && (
                     <p className="text-center text-sm text-gray-500">Tämä keskustelu on päättynyt. Et voi lähettää uusia viestejä.</p>
                )}
            </div>
        </div>
    );
};

export default LiveAgentConsole;
