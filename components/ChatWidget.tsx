// components/ChatWidget.tsx
import React, { useState, useEffect } from 'react';
import { useBotContext } from '../context/BotContext.tsx';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { useChat } from '../hooks/useChat.ts';
import { useScheduler } from '../hooks/useScheduler.ts';
import { MessageSquare } from './Icons.tsx';
import { Conversation, Message } from '../types.ts';
import BackgroundAnimation from './BackgroundAnimation.tsx';
import { generateId } from '../utils/id.ts';
import { translations, Language } from '../data/translations.ts';
import { ChatHeader } from './chat/ChatHeader.tsx';
import { ChatMessages } from './chat/ChatMessages.tsx';
import { ChatInput } from './chat/ChatInput.tsx';
import { ChatViewSwitcher } from './chat/ChatViewSwitcher.tsx';

interface ChatWidgetProps {
    visitorId: string;
}

type ActiveView = 'chat' | 'contact' | 'quote' | 'editName' | 'help';

const ChatWidget: React.FC<ChatWidgetProps> = ({ visitorId }) => {
    const { activeBot } = useBotContext();
    const { conversations, getOrCreateConversation, updateVisitorName, addMessage, addSubmission } = useConversationContext();
    
    // We ignore the global 'language' context for the ChatWidget UI itself.
    // Instead, we use the bot's configured language.
    const botLanguage = activeBot?.settings.behavior.language || 'fi';

    // Helper to get translations based on the BOT'S language, not the Admin's language.
    const tBot = (key: string): string => {
        const keys = translations[botLanguage] as Record<string, string>;
        return keys[key] || key;
    };
    
    const conversationFromContext = conversations.find(c => c.visitorId === visitorId && c.botId === activeBot?.id && !c.isEnded);

    const { messages, isLoading, handleSendMessage, handleStartNewConversation } = useChat(visitorId, conversationFromContext);
    const { isOnline } = useScheduler();

    // Check if we're embedded (widget mode) vs admin view
    // In embedded mode, start closed (small icon). In admin view, start open.
    const isEmbeddedCheck = typeof window !== 'undefined' && 
                           (window.location.search.includes('mode=widget') || 
                            document.querySelector('.flowbot-widget-container') !== null);
    
    // Start closed when embedded (showing small icon), open in admin view
    const [isOpen, setIsOpen] = useState(!isEmbeddedCheck);
    const [input, setInput] = useState('');
    const [chatSize, setChatSize] = useState<'medium' | 'large' | 'small'>('medium');
    const [activeView, setActiveView] = useState<ActiveView>('chat');
    const [newName, setNewName] = useState('');
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    
    useEffect(() => {
        if (isOpen && visitorId && !conversationFromContext) {
            getOrCreateConversation(visitorId);
        }
    }, [isOpen, visitorId, conversationFromContext, getOrCreateConversation]);

    useEffect(() => {
        // Reset to chat view when conversation changes
        setActiveView('chat');
        setShowSettingsMenu(false);
    }, [conversationFromContext?.id]);

    if (!activeBot || !activeBot.settings.schedule) return null;
    if (!activeBot.settings.appearance || !activeBot.settings.avatarSettings || !activeBot.settings.behavior) return null;

    const { appearance, personality, behavior } = activeBot.settings;
    const isAgentsOnlyOffline = behavior.operatingMode === 'agents_only' && !isOnline;
    
    // Check if we're embedded (widget mode) vs admin view
    const isEmbedded = typeof window !== 'undefined' && 
                       (window.location.search.includes('mode=widget') || 
                        document.querySelector('.flowbot-widget-container') !== null);
    
    // Use fixed heights for embedded widgets, percentage for admin view
    const sizeClasses = isEmbedded ? {
        small: 'w-80 h-[400px]',
        medium: 'w-96 h-[600px] max-h-[720px]',
        large: 'w-[480px] h-[700px] max-h-[720px]',
    } : {
        small: 'w-80 h-[50%]',
        medium: 'w-96 h-[80%] max-h-[720px]',
        large: 'w-[480px] h-[90%]',
    };

    const toggleChatSize = () => {
        if (chatSize === 'medium') setChatSize('large');
        else if (chatSize === 'large') setChatSize('small');
        else setChatSize('medium');
    };

    const handleNameChange = () => {
        if (!conversationFromContext) return;
        const currentName = conversationFromContext.visitorName;
        // Check against both FI and EN default 'Visitor' strings to clear the input
        const isDefault = currentName.startsWith('Vierailija') || currentName.startsWith('Visitor');
        setNewName(isDefault ? '' : currentName);
        setActiveView('editName');
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (conversationFromContext && newName && newName.trim() !== '' && newName.trim() !== conversationFromContext.visitorName) {
            const oldName = conversationFromContext.visitorName;
            const trimmedNewName = newName.trim();
            updateVisitorName(visitorId, trimmedNewName);
            const systemMessage: Message = {
                id: generateId(),
                text: `${oldName} ${tBot('chat.system_name_change')} ${trimmedNewName}.`,
                sender: 'system',
                timestamp: new Date().toISOString()
            };
            addMessage(visitorId, systemMessage);
        }
        setActiveView('chat');
        setNewName('');
    };

    const handleContactSubmit = async (data: { name: string; email: string; message: string }) => {
        // Ensure conversation exists before submitting
        let convId = conversationFromContext?.id;
        if (!convId) {
            const conv = await getOrCreateConversation(visitorId);
            convId = conv?.id;
        }

        if (convId) {
            await addSubmission(convId, 'contact', data);
        }

        const summary = `${tBot('chat.system_contact')}:\n- ${tBot('form.name')}: ${data.name}\n- ${tBot('form.email')}: ${data.email}`;
        const systemMessage: Message = {
            id: generateId(),
            text: summary,
            sender: 'system',
            timestamp: new Date().toISOString()
        };
        addMessage(visitorId, systemMessage);
        setActiveView('chat');
    };
    
    const confirmAndStartNewConversation = () => {
        if (window.confirm(tBot('chat.confirm_new'))) {
            handleStartNewConversation();
        }
    };

    const handleQuoteSubmit = async (data: { name: string; email: string; company?: string; details: string; }) => {
        // Ensure conversation exists before submitting
        let convId = conversationFromContext?.id;
        if (!convId) {
            const conv = await getOrCreateConversation(visitorId);
            convId = conv?.id;
        }

        if (convId) {
            await addSubmission(convId, 'quote', data);
        }

        const summary = `${tBot('chat.system_quote')}:\n- ${tBot('form.name')}: ${data.name}\n- ${tBot('form.email')}: ${data.email}`;
        const systemMessage: Message = {
            id: generateId(),
            text: summary,
            sender: 'system',
            timestamp: new Date().toISOString()
        };
        addMessage(visitorId, systemMessage);
        setActiveView('chat');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            handleSendMessage(input.trim());
            setInput('');
        }
    };
    
    const handleQuickReply = (text: string) => {
        if (!isLoading) {
            handleSendMessage(text);
        }
    };

    const colorVars = {
        '--color-primary': appearance.primaryColor,
        '--color-primary-light': `${appearance.primaryColor}B3`,
        '--header-bg': appearance.headerColor,
    } as React.CSSProperties;

    // Determine the theme class based on settings (defaulting to light if undefined)
    const themeClass = appearance.themeMode === 'dark' ? 'theme-dark' : 'theme-light';

    // Always use fixed positioning when embedded, absolute for admin view
    const positioningStyles = isEmbedded ? {
        position: 'fixed' as const,
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        left: 'auto',
        top: 'auto',
        margin: 0,
        ...(isOpen ? {
            width: chatSize === 'small' ? '320px' : chatSize === 'medium' ? '384px' : '480px',
            height: chatSize === 'small' ? '400px' : chatSize === 'medium' ? '600px' : '700px',
            maxWidth: chatSize === 'small' ? '320px' : chatSize === 'medium' ? '384px' : '480px',
            maxHeight: chatSize === 'small' ? '400px' : chatSize === 'medium' ? '600px' : '700px',
            minWidth: chatSize === 'small' ? '320px' : chatSize === 'medium' ? '384px' : '480px',
            minHeight: chatSize === 'small' ? '400px' : chatSize === 'medium' ? '600px' : '700px',
        } : {
            width: '64px',
            height: '64px',
            maxWidth: '64px',
            maxHeight: '64px',
            minWidth: '64px',
            minHeight: '64px',
        }),
    } : {};

    const contactInitialName = conversationFromContext?.visitorName.startsWith('Vierailija') || conversationFromContext?.visitorName.startsWith('Visitor') 
        ? '' 
        : conversationFromContext?.visitorName;

    return (
        <div style={colorVars} className={themeClass}>
            <div 
                className={`${isEmbedded ? '' : 'absolute'} bottom-5 right-5 z-50 transition-all duration-300 ${isOpen ? `${sizeClasses[chatSize]} shadow-2xl rounded-2xl` : 'w-16 h-16'}`}
                style={positioningStyles}
            >
                {isOpen ? (
                    <div 
                        className="w-full h-full bg-[var(--chat-bg)] rounded-2xl flex flex-col overflow-hidden border border-[var(--chat-border-color)] relative"
                        style={{
                            opacity: 1,
                            backgroundColor: isEmbedded 
                                ? (appearance.themeMode === 'dark' ? 'rgba(23, 23, 33, 1)' : '#ffffff')
                                : 'var(--chat-bg)',
                            width: '100%',
                            height: '100%',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <BackgroundAnimation animation={appearance.backgroundAnimation} />
                        
                        <div className="relative z-10 flex flex-col flex-1 h-full">
                            <ChatHeader
                                brandName={appearance.brandName}
                                botAvatar={activeBot.settings.avatarSettings.selectedBotAvatar}
                                isOnline={isOnline}
                                onlineText={tBot('chat.online')}
                                offlineText={tBot('chat.offline')}
                                chatSize={chatSize}
                                onToggleSize={toggleChatSize}
                                onClose={() => setIsOpen(false)}
                                showSettingsMenu={showSettingsMenu}
                                onToggleSettingsMenu={() => setShowSettingsMenu(!showSettingsMenu)}
                                onStartNewConversation={confirmAndStartNewConversation}
                                onShowHelp={() => setActiveView('help')}
                                onEditName={handleNameChange}
                                startNewText={tBot('chat.start_new')}
                                helpText="Ohjeet"
                                changeNameText="Vaihda nimi"
                                themeMode={appearance.themeMode}
                            />

                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {isAgentsOnlyOffline ? (
                                    <div className="p-4 text-center h-full flex flex-col justify-center items-center overflow-y-auto">
                                        <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">{tBot('chat.away')}</h3>
                                        <p className="text-sm text-[var(--chat-text-secondary)] mt-2">{activeBot.settings.schedule.offlineMessage}</p>
                                    </div>
                                ) : activeView !== 'chat' ? (
                                    <ChatViewSwitcher
                                        activeView={activeView}
                                        onBack={() => setActiveView('chat')}
                                        onContactSubmit={handleContactSubmit}
                                        contactInitialName={contactInitialName}
                                        onQuoteSubmit={handleQuoteSubmit}
                                        quoteInitialName={contactInitialName}
                                        newName={newName}
                                        onNewNameChange={setNewName}
                                        onNameSubmit={handleNameSubmit}
                                        nameChangeTitle={tBot('chat.name_change_title')}
                                        newNameLabel={tBot('chat.new_name_label')}
                                        saveText={tBot('chat.save')}
                                        helpText={behavior.helpText}
                                        language={botLanguage}
                                    />
                                ) : (
                                    <>
                                        <ChatMessages
                                            messages={messages}
                                            avatars={activeBot.settings.avatarSettings}
                                            botLanguage={botLanguage}
                                            availableAgents={activeBot?.settings.agents || []}
                                            quickReplies={personality.quickReplies}
                                            showQuickReplies={messages.length <= 1}
                                            onQuickReply={handleQuickReply}
                                        />
                                        <ChatInput
                                            input={input}
                                            onInputChange={setInput}
                                            onSubmit={handleSubmit}
                                            isLoading={isLoading}
                                            disabled={isAgentsOnlyOffline}
                                            placeholder={tBot('chat.input_placeholder')}
                                            showContactButton={behavior.showContactButton}
                                            showQuoteButton={behavior.showQuoteButton}
                                            contactText={tBot('chat.contact')}
                                            quoteText={tBot('chat.quote')}
                                            onShowContact={() => setActiveView('contact')}
                                            onShowQuote={() => setActiveView('quote')}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsOpen(true)} 
                        className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110" 
                        style={{ 
                            backgroundColor: 'var(--color-primary)',
                            opacity: 1,
                            position: 'relative',
                            zIndex: 9999,
                        }}
                    >
                        <MessageSquare className="w-8 h-8 text-white" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatWidget;
