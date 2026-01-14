
// hooks/useChat.ts
import { useState, useCallback, useEffect } from 'react';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { getChatResponseStream } from '../services/geminiService.ts';
import { Message, Conversation, RichContent } from '../types.ts';
import { generateId } from '../utils/id.ts';

export const useChat = (visitorId: string, conversation: Conversation | null) => {
    const { addMessage, updateMessageContent, endStream, startNewConversation } = useConversationContext();
    const { activeBot } = useBotContext();

    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    
    // This state tracks the ID of the message we just finished streaming.
    // We use it to prevent a race condition where a stale context update
    // overwrites our optimistic UI change (isStreaming: false).
    const [lastFinalizedMessageId, setLastFinalizedMessageId] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) return; // Don't sync from context during optimistic updates.

        const contextMessages = conversation?.messages || [];

        // If we are currently overriding the context for a just-finished message,
        // check if the context has caught up yet.
        if (lastFinalizedMessageId) {
            const msgInContext = contextMessages.find(m => m.id === lastFinalizedMessageId);
            // If the message is now in the context and is marked as not streaming,
            // we can clear our override and let the context be the source of truth again.
            if (msgInContext && !msgInContext.isStreaming) {
                setLastFinalizedMessageId(null);
            } else {
                // If the context is still stale, we return early, letting our
                // optimistic local state persist and preventing the indicator from reappearing.
                return;
            }
        }
        
        setMessages(contextMessages);
    }, [conversation, isLoading, lastFinalizedMessageId]);


    const handleSendMessage = useCallback(async (text: string) => {
        if (!activeBot) return; 

        const userMessage: Message = {
            id: generateId(),
            text,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        // If an agent is present in the chat, only send the user's message.
        if (conversation?.agentId) {
            setMessages(prevMessages => [...prevMessages, userMessage]);
            await addMessage(visitorId, userMessage);
            return;
        }

        // --- Bot response logic ---
        setIsLoading(true);

        const botPlaceholder: Message = {
            id: generateId(),
            text: '',
            sender: 'bot',
            timestamp: new Date().toISOString(),
            isStreaming: true
        };

        setMessages(prevMessages => [...prevMessages, userMessage, botPlaceholder]);

        // Await the creation/addition of the user message FIRST.
        // This ensures the conversation document exists before we try to add the bot placeholder.
        // addMessage now returns the conversation ID, which we capture.
        const conversationId = await addMessage(visitorId, userMessage);
        
        // Pass the updated conversation structure to Gemini (optimistic)
        const conversationForGemini: Conversation = {
            ...(conversation || { 
                id: conversationId || 'temp', // Use returned ID if available 
                botId: activeBot.id, 
                visitorId, 
                visitorName: 'Visitor', 
                messages: [], 
                isRead: true, 
                isEnded: false, 
                agentId: null 
            }),
            messages: [...(conversation?.messages || []), userMessage]
        };
        
        await addMessage(visitorId, botPlaceholder);

        try {
            const stream = getChatResponseStream(conversationForGemini, activeBot.settings);
            let fullResponse = '';
            let richContent: RichContent[] | undefined = undefined;
            
            for await (const chunk of stream) {
                // Normaali tekstichunk
                if (typeof chunk === 'string') {
                    fullResponse += chunk;
                    setMessages(prev => prev.map(msg => 
                        msg.id === botPlaceholder.id ? { ...msg, text: fullResponse } : msg
                    ));
                } else if (typeof chunk === 'object' && chunk !== null && 'richContent' in chunk) {
                    // Rich content chunk
                    richContent = chunk.richContent;
                    fullResponse = chunk.text || fullResponse;
                }
            }

            // Finalize the message in the local state immediately to remove the indicator.
            setMessages(prev => prev.map(msg => 
                msg.id === botPlaceholder.id ? { ...msg, text: fullResponse, richContent, isStreaming: false } : msg
            ));
            setLastFinalizedMessageId(botPlaceholder.id);
            
            // Persist the final state to the backend in the background.
            // We use the ID returned from the first addMessage call if available, fallback to context ID.
            const targetId = conversationId || conversation?.id;

            if (targetId) {
                await updateMessageContent(targetId, botPlaceholder.id, fullResponse, richContent);
                await endStream(targetId, botPlaceholder.id);
            } 

        } catch (error) {
            console.error("Error in chat stream:", error);
            const errorText = "Pahoittelut, tekoälyyn ei saatu yhteyttä.";
            
            setMessages(prev => prev.map(msg => 
                msg.id === botPlaceholder.id ? { ...msg, text: errorText, isStreaming: false } : msg
            ));
            setLastFinalizedMessageId(botPlaceholder.id);
            
            const targetId = conversationId || conversation?.id;
            if (targetId) {
                await updateMessageContent(targetId, botPlaceholder.id, errorText);
                await endStream(targetId, botPlaceholder.id);
            }
        } finally {
            setIsLoading(false);
        }
    }, [activeBot, conversation, visitorId, addMessage, updateMessageContent, endStream]);


    const handleStartNewConversation = useCallback(async () => {
        if (!visitorId) return;
        await startNewConversation(visitorId);
    }, [visitorId, startNewConversation]);

    return {
        messages,
        isLoading,
        handleSendMessage: handleSendMessage,
        handleStartNewConversation,
    };
};
