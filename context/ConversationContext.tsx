
import React, { createContext, useContext, ReactNode } from 'react';
import { Conversation, Sender, Message } from '../types.ts';
import { useConversations } from '../hooks/useConversations.ts';

interface ConversationContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversationId: (id: string | null) => void;
  addMessage: (visitorId: string, message: Message) => Promise<string | null>;
  updateMessageContent: (conversationId: string, messageId: string, newContent: string) => void;
  endStream: (conversationId: string, messageId: string) => void;
  getOrCreateConversation: (visitorId: string) => Promise<Conversation>;
  updateVisitorName: (visitorId: string, name: string) => void;
  markAgentJoined: (conversationId: string, agentId: string, agentName: string) => void;
  agentLeaveConversation: (conversationId: string, agentName: string) => void;
  archiveConversation: (conversationId: string) => void;
  startNewConversation: (visitorId: string) => Promise<Conversation | undefined>;
  addSubmission: (conversationId: string, type: 'contact' | 'quote', data: Record<string, string>) => Promise<void>;
  updateSubmissionStatus: (conversationId: string, submissionId: string, isHandled: boolean) => Promise<void>;
  updateConversationStatus: (conversationId: string, status: 'pending' | 'handled') => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const conversationManager = useConversations();

  return (
    <ConversationContext.Provider value={conversationManager}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
};
