
// components/MessageBubble.tsx
import React, { useRef } from 'react';
import { Message, AvatarSettings } from '../types.ts';
import { formatTime } from '../utils/time.ts';
import Markdown from 'react-markdown';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Language } from '../data/translations.ts';
import { PersonCard } from './PersonCard.tsx';
import { ProductCard } from './ProductCard.tsx';
import { convertTextToMarkdownLinks } from '../utils/textParser.tsx';
import { useHostStyleOverride } from '../hooks/useHostStyleOverride.ts';

interface MessageBubbleProps {
    message: Message;
    avatars: AvatarSettings;
    perspective: 'customer' | 'agent';
    senderName?: string;
    language?: Language;
    agentAvatar?: string;
    themeMode?: 'dark' | 'light';
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-current rounded-full" style={{ animation: 'bouncing-dots 1s infinite 0s' }}></span>
        <span className="w-2 h-2 bg-current rounded-full" style={{ animation: 'bouncing-dots 1s infinite 0.2s' }}></span>
        <span className="w-2 h-2 bg-current rounded-full" style={{ animation: 'bouncing-dots 1s infinite 0.4s' }}></span>
    </div>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, avatars, perspective, senderName, agentAvatar, language: propLanguage, themeMode }) => {
    const isUser = message.sender === 'user';
    const isBot = message.sender === 'bot';
    const isAgent = message.sender === 'agent';
    const isSystem = message.sender === 'system';
    const { language: contextLanguage } = useLanguage();
    
    // Use prop language if provided, otherwise fallback to context
    const language = propLanguage || contextLanguage;

    // Correct alignment logic
    const isAlignedRight = (perspective === 'customer' && isUser) || (perspective === 'agent' && (isBot || isAgent));
    const alignment = isAlignedRight ? 'justify-end' : 'justify-start';

    const getBubbleColor = () => {
        if (perspective === 'customer') {
            return isUser ? 'bg-[var(--color-primary)] text-[var(--chat-bubble-user-text)]' : 'text-[var(--chat-text-primary)]';
        }
        // Agent perspective
        if (isUser) return 'bg-gray-700 text-white';
        if (isAgent) return 'bg-blue-600 text-white';
        return 'bg-purple-800 text-white'; // Bot
    };

    const getBubbleStyle = () => {
        if (perspective === 'customer' && !isUser) {
            // Bot message in customer perspective - use CSS variable
            // This prevents host site CSS from affecting the color
            return {
                backgroundColor: 'var(--chat-bubble-bot-bg)',
            };
        }
        return undefined;
    };

    const getAvatar = () => {
        if (isUser) return avatars.selectedUserAvatar;
        if (isAgent) return agentAvatar || avatars.selectedAgentAvatar;
        return avatars.selectedBotAvatar; // Bot
    };

    if (isSystem) {
        return (
            <div className="text-center text-xs text-gray-500 py-2">
                {message.text}
            </div>
        );
    }
    
    // Don't render empty, non-streaming messages from the bot.
    if ((isBot || isAgent) && !message.isStreaming && !message.text?.trim()) {
        return null;
    }

    const bubbleColor = getBubbleColor();
    const avatarSrc = getAvatar();
    // Show avatar for non-user in customer view, and for user in agent view
    const showAvatar = (perspective === 'customer' && !isUser) || (perspective === 'agent' && isUser);
    
    // Show sender name only in agent perspective for bot or agent messages
    const showSenderName = perspective === 'agent' && senderName;

    // Check if message has rich content
    const hasRichContent = message.richContent && message.richContent.length > 0;
    // Use full width for rich content messages, otherwise use constrained width
    const maxWidthClass = hasRichContent ? 'w-full' : 'max-w-xs md:max-w-md lg:max-w-lg';

    // Refs for containers to apply styles to p elements
    const bubbleRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Apply !important styles to override host site CSS
    useHostStyleOverride(
        [bubbleRef, containerRef],
        [message.text, message.richContent, message.ctaLink, themeMode],
        { themeMode }
    );

    return (
        <div className={`flex items-end gap-3 ${alignment}`}>
            {showAvatar && (
                 <img 
                     src={avatarSrc} 
                     alt="avatar" 
                     className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                 />
            )}
            
            {/* Spacer to align bubbles correctly when avatar is not shown */}
            {!showAvatar && <div className="w-8 flex-shrink-0" />}

            <div ref={containerRef} className={maxWidthClass}>
                {showSenderName && (
                    <p className={`text-xs text-gray-400 mb-1 ${isAlignedRight ? 'text-right' : 'text-left'}`}>
                        {senderName}
                    </p>
                )}
                
                {/* Rich Content Cards */}
                {hasRichContent && (
                    <div className="mb-2">
                        {message.richContent!.map((content, index) => {
                            if (content.type === 'personCard') {
                                return (
                                    <PersonCard
                                        key={index}
                                        name={content.name}
                                        avatar={content.avatar}
                                        email={content.email}
                                        phone={content.phone}
                                        whatsapp={content.whatsapp}
                                    />
                                );
                            } else if (content.type === 'productCard') {
                                return (
                                    <ProductCard
                                        key={index}
                                        title={content.title}
                                        image={content.image}
                                        url={content.url}
                                        description={content.description}
                                    />
                                );
                            }
                            return null;
                        })}
                    </div>
                )}
                
                {/* Viestin teksti jos se on olemassa */}
                {message.text && (
                    <div 
                        ref={bubbleRef}
                        className={`px-4 py-2.5 rounded-2xl ${bubbleColor} ${isAlignedRight ? 'rounded-br-lg' : 'rounded-bl-lg'}`}
                        style={getBubbleStyle()}
                    >
                        <div className="prose prose-sm text-current break-words">
                            {message.isStreaming && !message.text ? (
                                 <TypingIndicator />
                            ) : (
                                <Markdown>{convertTextToMarkdownLinks(message.text)}</Markdown>
                            )}
                            {message.isStreaming && message.text && <span className="inline-block w-2 h-4 bg-current rounded-sm animate-pulse ml-1 align-bottom"></span>}
                        </div>
                    </div>
                )}
                {/* CTA-linkki jos se on olemassa */}
                {message.ctaLink && (
                    <div className={`mt-3 ${isAlignedRight ? 'text-right' : 'text-left'}`}>
                        <a
                            href={message.ctaLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
                        >
                            {message.ctaLink.text} →
                        </a>
                        {message.ctaLink.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {message.ctaLink.description}
                            </p>
                        )}
                    </div>
                )}
                <p className={`text-xs text-gray-500 mt-1 ${isAlignedRight ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.timestamp, language)}
                </p>
            </div>
        </div>
    );
};
