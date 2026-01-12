
// components/ChatWidget.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useBotContext } from '../context/BotContext.tsx';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { useChat } from '../hooks/useChat.ts';
import { useScheduler } from '../hooks/useScheduler.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { Send, X, RefreshCcw, MessageSquare, ArrowDown, ChevronsUpDown, User, Mail, Briefcase, ArrowLeft, Settings, HelpCircle, Cog } from './Icons.tsx';
import { IconName, Conversation, Message } from '../types.ts';
import * as Icons from './Icons.tsx';
import BackgroundAnimation from './BackgroundAnimation.tsx';
import ContactForm from './ContactForm.tsx';
import QuoteForm from './QuoteForm.tsx';
import { isSameDay, formatDateSeparator } from '../utils/time.ts';
import { generateId } from '../utils/id.ts';
import { translations, Language } from '../data/translations.ts';


interface ChatWidgetProps {
    visitorId: string;
}

type ActiveView = 'chat' | 'contact' | 'quote' | 'editName' | 'help';

const getIconComponent = (iconName: IconName): React.FC<React.SVGProps<SVGSVGElement>> => {
    return Icons[iconName] || Icons.HelpCircle;
};

// DateSeparator modified to take language as prop
const DateSeparator: React.FC<{ timestamp: string, language: Language }> = ({ timestamp, language }) => {
    return (
        <div className="py-2 text-center">
            <span className="px-2 py-1 text-xs text-[var(--chat-text-muted)] bg-[var(--chat-button-bg)] rounded-full">{formatDateSeparator(timestamp, language)}</span>
        </div>
    );
};


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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        let isMounted = true;
        if (isOpen && visitorId && !conversationFromContext) {
            getOrCreateConversation(visitorId);
        }
        return () => { isMounted = false; };
    }, [isOpen, visitorId, conversationFromContext, getOrCreateConversation]);


    useEffect(() => {
        if(isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, activeView]);
    
    useEffect(() => {
        // Reset to chat view when conversation changes
        setActiveView('chat');
        setShowSettingsMenu(false); // Sulje dropdown-valikko kun keskustelu vaihtuu
    }, [conversationFromContext?.id]);

    // Sulje dropdown-valikko kun klikataan sen ulkopuolelle
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setShowSettingsMenu(false);
            }
        };

        if (showSettingsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettingsMenu]);

    // Sulje dropdown-valikko kun klikataan sen ulkopuolelle
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setShowSettingsMenu(false);
            }
        };

        if (showSettingsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettingsMenu]);


    if (!activeBot || !activeBot.settings.schedule) return null;
    if (!activeBot.settings.appearance || !activeBot.settings.avatarSettings || !activeBot.settings.behavior) return null;

    const { appearance, personality, behavior } = activeBot.settings;
    const isAgentsOnlyOffline = behavior.operatingMode === 'agents_only' && !isOnline;
    
    // Check if we're embedded (widget mode) vs admin view
    // In embedded mode, use fixed positioning. In admin view, use absolute.
    // Check if parent has flowbot-widget-container class (set by embed.tsx)
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
    // For embedded widgets, use inline styles to ensure proper positioning regardless of page CSS
    // For embedded widgets, ensure fixed positioning and proper sizing
    const positioningStyles = isEmbedded ? {
        position: 'fixed' as const,
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        left: 'auto',
        top: 'auto',
        margin: 0,
        // When closed: fixed small icon size
        // When open: use fixed sizes based on chatSize
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
                            <header className="flex-shrink-0 p-2 flex items-center justify-between text-[var(--chat-header-text)]" style={{ backgroundColor: 'var(--header-bg)' }}>
                                <div className="flex items-center gap-2">
                                    <img 
                                        src={activeBot.settings.avatarSettings.selectedBotAvatar} 
                                        alt="bot" 
                                        className="w-8 h-8 rounded-full flex-shrink-0" 
                                        style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                    />
                                    <div>
                                        <h3 className="font-bold text-sm">{appearance.brandName}</h3>
                                        <p className="text-xs opacity-80">{isOnline ? tBot('chat.online') : tBot('chat.offline')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleChatSize} title="Vaihda kokoa" className="p-1 text-current/80 hover:text-current"><ChevronsUpDown className="w-4 h-4"/></button>
                                    <div className="relative" ref={settingsMenuRef}>
                                        <button 
                                            onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
                                            title="Asetukset" 
                                            className={`p-1 rounded-md transition-all ${showSettingsMenu ? 'bg-[var(--chat-input-bg)] text-current' : 'text-current/80 hover:text-current'}`}
                                        >
                                            <Cog className="w-4 h-4"/>
                                        </button>
                                        {showSettingsMenu && (
                                            <div 
                                                className="absolute right-0 mt-2 w-48 border border-[var(--chat-border-color)] rounded-lg shadow-lg z-[100] overflow-hidden backdrop-blur-sm" 
                                                style={{ 
                                                    backgroundColor: appearance.themeMode === 'dark' 
                                                        ? 'rgba(55, 55, 75, 1)' 
                                                        : '#f3f4f6'
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setShowSettingsMenu(false);
                                                        confirmAndStartNewConversation();
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-button-bg)] flex items-center gap-2"
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                    {tBot('chat.start_new')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowSettingsMenu(false);
                                                        setActiveView('help');
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-button-bg)] flex items-center gap-2"
                                                >
                                                    <HelpCircle className="w-4 h-4" />
                                                    Ohjeet
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowSettingsMenu(false);
                                                        setActiveView('editName');
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-button-bg)] flex items-center gap-2"
                                                >
                                                    <User className="w-4 h-4" />
                                                    Vaihda nimi
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setIsOpen(false)} 
                                        title="Pienennä" 
                                        className="p-1 text-[var(--chat-header-text)]/80 hover:text-[var(--chat-header-text)] transition-colors"
                                        style={{ color: 'inherit', zIndex: 10 }}
                                    >
                                        <ArrowDown className="w-4 h-4"/>
                                    </button>
                                </div>
                            </header>

                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {isAgentsOnlyOffline ? (
                                    <div className="p-4 text-center h-full flex flex-col justify-center items-center overflow-y-auto">
                                        <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">{tBot('chat.away')}</h3>
                                        <p className="text-sm text-[var(--chat-text-secondary)] mt-2">{activeBot.settings.schedule.offlineMessage}</p>
                                    </div>
                                ) : activeView === 'contact' ? (
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        <ContactForm
                                            onBack={() => setActiveView('chat')}
                                            onSubmit={handleContactSubmit}
                                            initialName={conversationFromContext?.visitorName.startsWith('Vierailija') || conversationFromContext?.visitorName.startsWith('Visitor') ? '' : conversationFromContext?.visitorName}
                                            language={botLanguage}
                                        />
                                    </div>
                                ) : activeView === 'quote' ? (
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        <QuoteForm
                                            onBack={() => setActiveView('chat')}
                                            onSubmit={handleQuoteSubmit}
                                            initialName={conversationFromContext?.visitorName.startsWith('Vierailija') || conversationFromContext?.visitorName.startsWith('Visitor') ? '' : conversationFromContext?.visitorName}
                                            language={botLanguage}
                                        />
                                    </div>
                                ) : activeView === 'editName' ? (
                                    <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col">
                                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                                            <button onClick={() => setActiveView('chat')} className="text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] p-1 rounded-full">
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">{tBot('chat.name_change_title')}</h3>
                                        </div>
                                        <form onSubmit={handleNameSubmit} className="space-y-4 flex-grow flex flex-col">
                                            <div>
                                                <label htmlFor="newName" className="block text-sm font-medium text-[var(--chat-text-secondary)]">{tBot('chat.new_name_label')}</label>
                                                <input 
                                                    type="text" 
                                                    name="newName" 
                                                    id="newName" 
                                                    required 
                                                    value={newName} 
                                                    onChange={(e) => setNewName(e.target.value)} 
                                                    className="mt-1 w-full text-sm px-4 py-2 bg-[var(--chat-input-bg)] text-[var(--chat-text-primary)] border border-[var(--chat-border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" 
                                                />
                                            </div>
                                            <div className="flex-grow"></div>
                                            <button type="submit" className="w-full flex items-center justify-center gap-2 p-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all font-semibold flex-shrink-0" style={{ backgroundImage: `linear-gradient(to right, var(--color-primary), var(--color-primary-light))` }}>
                                                {tBot('chat.save')}
                                            </button>
                                        </form>
                                    </div>
                                ) : activeView === 'help' ? (
                                    <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col">
                                        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                                            <button onClick={() => setActiveView('chat')} className="text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] p-1 rounded-full">
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">Ohjeet</h3>
                                        </div>
                                        <div className="space-y-4 text-[var(--chat-text-primary)]">
                                            {behavior.helpText ? (
                                                <div className="whitespace-pre-wrap text-sm text-[var(--chat-text-secondary)]">
                                                    {behavior.helpText}
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Miten käytän chattia?</h4>
                                                        <p className="text-sm text-[var(--chat-text-secondary)]">
                                                            Voit kirjoittaa viestejä chat-ikkunaan ja saada automaattisia vastauksia. 
                                                            Jos tarvitset lisäapua, voit pyytää yhdistämään sinut asiakaspalvelijaan.
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Miten aloitan uuden keskustelun?</h4>
                                                        <p className="text-sm text-[var(--chat-text-secondary)]">
                                                            Klikkaa asetukset-ikonia ja valitse "Aloita uusi keskustelu" aloittaaksesi uuden keskustelun.
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Miten vaihdan nimeni?</h4>
                                                        <p className="text-sm text-[var(--chat-text-secondary)]">
                                                            Klikkaa asetukset-ikonia ja valitse "Vaihda nimi" muuttaaksesi nimesi chattiin.
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Miten saan apua?</h4>
                                                        <p className="text-sm text-[var(--chat-text-secondary)]">
                                                            Jos et löydä vastausta kysymykseesi, voit pyytää yhdistämään sinut asiakaspalvelijaan 
                                                            tai lähettää yhteydenottopyynnön.
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                                            {(() => {
                                                const availableAgents = activeBot?.settings.agents || [];
                                                
                                                return messages.map((msg, index) => {
                                                    const prevMsg = messages[index - 1];
                                                    const showDateSeparator = !prevMsg || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));
                                                    
                                                    // Find agent by message's agentId
                                                    const messageAgent = msg.sender === 'agent' && msg.agentId
                                                        ? availableAgents.find(a => a.id === msg.agentId)
                                                        : null;
                                                    
                                                    return (
                                                        <React.Fragment key={msg.id}>
                                                            {showDateSeparator && <DateSeparator timestamp={msg.timestamp} language={botLanguage} />}
                                                            <MessageBubble 
                                                                message={msg} 
                                                                avatars={activeBot.settings.avatarSettings} 
                                                                perspective="customer"
                                                                language={botLanguage}
                                                                agentAvatar={messageAgent?.avatar}
                                                            />
                                                        </React.Fragment>
                                                    );
                                                });
                                            })()}
                                            {/* Quick Replies appear inside the message flow */}
                                            {personality.quickReplies && personality.quickReplies.length > 0 && messages.length <= 1 && (
                                                <div className="flex flex-wrap gap-2 pt-2 justify-start">
                                                    {personality.quickReplies.map(qr => {
                                                        // Get localized text or fallback to FI
                                                        const qrText = (typeof qr.text === 'object' ? qr.text[botLanguage] || qr.text.fi : qr.text) as string;
                                                        
                                                        // Skip if text is empty in current language
                                                        if (!qrText) return null;

                                                        const Icon = getIconComponent(qr.icon);
                                                        return (
                                                        <button key={qr.id} onClick={() => handleQuickReply(qrText)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-sm text-gray-700 rounded-full hover:bg-gray-100 shadow-sm">
                                                            <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                                                            {qrText}
                                                        </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                        <div className="flex-shrink-0 p-3 bg-[var(--chat-footer-bg)] border-t border-[var(--chat-border-color)]">
                                            {/* Contact & Quote buttons are always visible if enabled */}
                                            {(behavior.showContactButton || behavior.showQuoteButton) && (
                                                 <div className="flex flex-wrap gap-2 mb-2">
                                                    {behavior.showContactButton && (
                                                         <button 
                                                            onClick={() => setActiveView('contact')} 
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--chat-input-bg)] text-sm text-[var(--chat-text-primary)] rounded-full hover:bg-[var(--chat-button-bg)] transition-colors border border-[var(--chat-border-color)]"
                                                        >
                                                            <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                                                            {tBot('chat.contact')}
                                                        </button>
                                                    )}
                                                     {behavior.showQuoteButton && (
                                                         <button 
                                                            onClick={() => setActiveView('quote')} 
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--chat-input-bg)] text-sm text-[var(--chat-text-primary)] rounded-full hover:bg-[var(--chat-button-bg)] transition-colors border border-[var(--chat-border-color)]"
                                                        >
                                                            <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
                                                            {tBot('chat.quote')}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={input}
                                                    onChange={(e) => setInput(e.target.value)}
                                                    placeholder={tBot('chat.input_placeholder')}
                                                    disabled={isAgentsOnlyOffline}
                                                    className="w-full text-sm px-4 py-2 bg-[var(--chat-input-bg)] text-[var(--chat-text-primary)] border border-[var(--chat-border-color)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder-[var(--chat-text-muted)]"
                                                />
                                                <button type="submit" disabled={!input.trim() || isLoading || isAgentsOnlyOffline} className="p-2.5 text-white rounded-full disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)'}}>
                                                    <Send className="w-5 h-5"/>
                                                </button>
                                            </form>
                                        </div>
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
