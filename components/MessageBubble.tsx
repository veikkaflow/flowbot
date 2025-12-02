
// components/MessageBubble.tsx
import React from 'react';
import { Message, AvatarSettings } from '../types.ts';
import { formatTime } from '../utils/time.ts';
import Markdown from 'react-markdown';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Language } from '../data/translations.ts';

interface MessageBubbleProps {
    message: Message;
    avatars: AvatarSettings;
    perspective: 'customer' | 'agent';
    senderName?: string;
    language?: Language;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-current rounded-full" style={{ animation: 'bouncing-dots 1s infinite 0s' }}></span>
        <span className="w-2 h-2 bg-current rounded-full" style={{ animation: 'bouncing-dots 1s infinite 0.2s' }}></span>
        <span className="w-2 h-2 bg-current rounded-full" style={{ animation: 'bouncing-dots 1s infinite 0.4s' }}></span>
    </div>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, avatars, perspective, senderName, language: propLanguage }) => {
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
            return isUser ? 'bg-[var(--color-primary)] text-[var(--chat-bubble-user-text)]' : 'bg-[var(--chat-bubble-bot-bg)] text-[var(--chat-text-primary)]';
        }
        // Agent perspective
        if (isUser) return 'bg-gray-700 text-white';
        if (isAgent) return 'bg-blue-600 text-white';
        return 'bg-purple-800 text-white'; // Bot
    };

    const getAvatar = () => {
        if (isUser) return avatars.selectedUserAvatar;
        if (isAgent) return avatars.selectedAgentAvatar;
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

    return (
        <div className={`flex items-end gap-3 ${alignment}`}>
            {showAvatar && (
                 <img src={avatarSrc} alt="avatar" className="w-8 h-8 rounded-full flex-shrink-0" />
            )}
            
            {/* Spacer to align bubbles correctly when avatar is not shown */}
            {!showAvatar && <div className="w-8 flex-shrink-0" />}

            <div className="max-w-xs md:max-w-md lg:max-w-lg">
                {showSenderName && (
                    <p className={`text-xs text-gray-400 mb-1 ${isAlignedRight ? 'text-right' : 'text-left'}`}>
                        {senderName}
                    </p>
                )}
                <div className={`px-4 py-2.5 rounded-2xl ${bubbleColor} ${isAlignedRight ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>
                    <div className="prose prose-sm text-current break-words">
                        {message.isStreaming && !message.text ? (
                             <TypingIndicator />
                        ) : (
                            <Markdown>{message.text}</Markdown>
                        )}
                        {message.isStreaming && message.text && <span className="inline-block w-2 h-4 bg-current rounded-sm animate-pulse ml-1 align-bottom"></span>}
                    </div>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${isAlignedRight ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.timestamp, language)}
                </p>
            </div>
        </div>
    );
};
