import React, { useEffect, useRef } from 'react';
import { Message } from '../../types.ts';
import { MessageBubble } from '../MessageBubble.tsx';
import { DateSeparator } from './DateSeparator.tsx';
import { QuickReplies } from './QuickReplies.tsx';
import { isSameDay } from '../../utils/time.ts';
import { Language } from '../../data/translations.ts';
import { AvatarSettings, QuickReply } from '../../types.ts';

interface ChatMessagesProps {
  messages: Message[];
  avatars: AvatarSettings;
  botLanguage: Language;
  availableAgents: Array<{ id: string; avatar?: string }>;
  quickReplies?: QuickReply[];
  showQuickReplies: boolean;
  onQuickReply: (text: string) => void;
  themeMode?: 'dark' | 'light';
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  avatars,
  botLanguage,
  availableAgents,
  quickReplies,
  showQuickReplies,
  onQuickReply,
  themeMode,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0"
      style={{
        flex: '1 1 0%',
        overflowY: 'auto',
        padding: '1rem',
        minHeight: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {messages.map((msg, index) => {
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
              avatars={avatars} 
              perspective="customer"
              language={botLanguage}
              agentAvatar={messageAgent?.avatar}
              themeMode={themeMode}
            />
          </React.Fragment>
        );
      })}
      {showQuickReplies && quickReplies && quickReplies.length > 0 && (
        <QuickReplies 
          quickReplies={quickReplies} 
          language={botLanguage} 
          onQuickReply={onQuickReply}
        />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};


