
import React, { useState, useEffect, useRef } from 'react';
import { Conversation, AvatarSettings, Agent } from '../types.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { Send, UserCheck, UserX, Archive, FileText, Loader, ArrowDown } from './Icons.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import { getConversationSummary } from '../services/geminiService.ts';
import { isSameDay, formatDateSeparator } from '../utils/time.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { db } from '../services/firebase.ts';
import { updateDoc, doc } from 'firebase/firestore';
interface LiveAgentConsoleProps {
    conversation: Conversation;
    onSendMessage: (text: string) => void;
    avatars: AvatarSettings;
}

const DateSeparator: React.FC<{ timestamp: string }> = ({ timestamp }) => {
    const { language } = useLanguage();
    return (
        <div className="py-2 text-center">
            <span className="px-2 py-1 text-xs rounded-full" style={{
                color: 'var(--admin-text-secondary, #d1d5db)',
                backgroundColor: 'var(--admin-sidebar-bg, #374151)'
            }}>{formatDateSeparator(timestamp, language)}</span>
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

            await updateDoc(doc(db, 'conversations', conversation.id), { summary: summary });

                addNotification({
                    message: `Yhteenveto luotu onnistuneesti.`,
                    type: 'success',
                    timestamp: new Date().toISOString()
                });

        } catch (error) {
            console.error("Error saving summary:", error);
            addNotification({ message: 'Yhteenvedon luonti epäonnistui.', type: 'error' });
        } finally {
            setIsSummarizing(false);
        }
    };

    const isInputDisabled = conversation.isEnded || !assignedAgent;

    const renderHeaderStatus = () => {
        if (conversation.isEnded) {
            return <p className="text-sm" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>Keskustelu päättynyt</p>;
        }
        if (assignedAgent) {
             return (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                    <img src={assignedAgent.avatar} alt={assignedAgent.name} className="w-8 h-8 rounded-full"/>
                    <span>{assignedAgent.name}</span>
                </div>
            );
        }
        return <p className="text-sm" style={{ color: '#fbbf24' }}>Odottaa agenttia</p>
    };

    return (
        <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--admin-card-bg, #1f2937)' }}>
            <header className="flex-shrink-0 p-4 border-b flex items-center justify-between relative" style={{
                borderColor: 'var(--admin-border, #374151)',
                backgroundColor: 'var(--admin-card-bg, #1f2937)'
            }}>
                <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{conversation.visitorName || `Vieras ${conversation.visitorId.substring(0, 6)}`}</h3>
                    {renderHeaderStatus()}
                </div>
                <div className="flex items-center gap-4">
                    {!conversation.isEnded && (
                        <>
                            <button 
                                onClick={handleGetSummary} 
                                disabled={isSummarizing} 
                                title="Luo yhteenveto" 
                                className="p-2 disabled:opacity-50 transition-colors"
                                style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                onMouseEnter={(e) => {
                                    if (!isSummarizing) {
                                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSummarizing) {
                                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                    }
                                }}
                            >
                                {isSummarizing ? <Loader className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                            </button>
                             <button 
                                onClick={handleArchive} 
                                title="Arkistoi keskustelu" 
                                className="p-2 transition-colors"
                                style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                }}
                            >
                                <Archive className="w-5 h-5" />
                            </button>
                            {assignedAgent ? (
                                <button 
                                    onClick={handleLeave} 
                                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md text-white transition-colors"
                                    style={{ backgroundColor: '#991b1b' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#b91c1c';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#991b1b';
                                    }}
                                >
                                    <UserX className="w-4 h-4"/> Poistu
                                </button>
                            ) : (
                                availableAgents.length > 0 && (
                                    <div className="relative">
                                        <button 
                                            onClick={toggleJoinMenu} 
                                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md text-white transition-colors"
                                            style={{ backgroundColor: '#15803d' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#16a34a';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#15803d';
                                            }}
                                        >
                                            <UserCheck className="w-4 h-4" /> Liity
                                        </button>
                                        
                                        {isJoinMenuOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-xl z-50 overflow-hidden border" style={{
                                                backgroundColor: 'var(--admin-dropdown-bg, #1f2937)',
                                                borderColor: 'var(--admin-border, #374151)'
                                            }}>
                                                <div className="p-2 text-xs border-b font-semibold" style={{
                                                    color: 'var(--admin-text-secondary, #d1d5db)',
                                                    borderColor: 'var(--admin-border, #374151)'
                                                }}>{t('agent.select_to_join')}</div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {availableAgents.map(agent => (
                                                        <button 
                                                            key={agent.id}
                                                            onClick={() => handleJoinAs(agent)}
                                                            className="w-full flex items-center gap-2 p-2 text-left transition-colors"
                                                            style={{
                                                                backgroundColor: 'transparent',
                                                                color: 'var(--admin-text-primary, #f3f4f6)'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'var(--admin-dropdown-hover, #374151)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                            }}
                                                        >
                                                            <img src={agent.avatar} alt={agent.name} className="w-6 h-6 rounded-full"/>
                                                            <span className="text-sm">{agent.name}</span>
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
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ backgroundColor: 'var(--admin-card-bg, #1f2937)' }}>
                 {conversation.messages.length === 0 && (
                    <div className="flex h-full items-center justify-center" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>
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

            <div className="flex-shrink-0 p-4 border-t relative" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                {!assignedAgent && !conversation.isEnded && (
                    <div>
                         {isJoinMenuOpen && availableAgents.length > 1 ? (
                            <div className="rounded-lg p-2 mb-2 border" style={{
                                backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                borderColor: 'var(--admin-border, #374151)'
                            }}>
                                <p className="text-sm mb-2 px-1" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('agent.select_to_join')}:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableAgents.map(agent => (
                                        <button 
                                            key={agent.id}
                                            onClick={() => handleJoinAs(agent)}
                                            className="flex items-center gap-2 p-2 rounded-lg border text-left transition-all"
                                            style={{
                                                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                                                borderColor: 'var(--admin-border, #374151)',
                                                color: 'var(--admin-text-primary, #f3f4f6)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #1f2937)';
                                            }}
                                        >
                                            <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full"/>
                                            <span className="text-sm font-medium">{agent.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setIsJoinMenuOpen(false)} 
                                    className="w-full mt-2 py-2 text-xs transition-colors"
                                    style={{ color: 'var(--admin-text-muted, #9ca3af)' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--admin-text-muted, #9ca3af)';
                                    }}
                                >
                                    Peruuta
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={toggleJoinMenu} 
                                disabled={availableAgents.length === 0}
                                className="w-full flex items-center justify-center gap-2 text-base font-semibold px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                                style={{ backgroundColor: '#15803d' }}
                                onMouseEnter={(e) => {
                                    if (availableAgents.length > 0) {
                                        e.currentTarget.style.backgroundColor = '#16a34a';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (availableAgents.length > 0) {
                                        e.currentTarget.style.backgroundColor = '#15803d';
                                    }
                                }}
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
                            className="w-full text-sm p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none border"
                            style={{
                                backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                borderColor: 'var(--admin-border, #374151)',
                                color: 'var(--admin-text-primary, #f3f4f6)'
                            }}
                        />
                        <button type="submit" disabled={!input.trim()} className="p-3 text-white rounded-lg disabled:opacity-50 bg-[var(--color-primary)] hover:brightness-110">
                            <Send className="w-5 h-5"/>
                        </button>
                    </form>
                )}
                {conversation.isEnded && (
                     <p className="text-center text-sm" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>Tämä keskustelu on päättynyt. Et voi lähettää uusia viestejä.</p>
                )}
            </div>
        </div>
    );
};

export default LiveAgentConsole;
