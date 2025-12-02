
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Conversation, Message, Sender, Submission } from '../types.ts';
import { useBotContext } from '../context/BotContext.tsx';
import { generateId } from '../utils/id.ts';
import { db } from '../services/firebase.ts';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    getDocs,
    limit,
    arrayUnion,
    getDoc
} from 'firebase/firestore';
import { conversationConverter, sanitizeForState } from '../services/firestoreConverters.ts';
import { translateText } from '@/services/geminiService.ts';
import { useLanguage } from '@/context/LanguageContext.tsx';


const isSimulationVisitorId = (id: string) => id.startsWith('sim_');
const isSimulationConversationId = (id: string) => id.startsWith('sim_conv_');

export const useConversations = () => {
    const { activeBot } = useBotContext();
    const [firestoreConversations, setFirestoreConversations] = useState<Conversation[]>([]);
    const [simulationConversations, setSimulationConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { language: adminLanguage } = useLanguage(); 
    // Cache to store in-progress creation promises to prevent race conditions
    const pendingCreations = useRef<Record<string, Promise<Conversation>>>({});

    useEffect(() => {
        if (!activeBot) {
            setFirestoreConversations([]);
            return;
        }
        
        const conversationsCollection = collection(db, 'conversations').withConverter(conversationConverter);
        const q = query(conversationsCollection, where('botId', '==', activeBot.id));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const conversationsFromDb = querySnapshot.docs.map(doc => doc.data());
            setFirestoreConversations(conversationsFromDb);
        }, (error) => {
            console.error("Error fetching conversations:", error);
        });

        return () => unsubscribe();
    }, [activeBot]);

    const conversations = useMemo(() => {
        return [...firestoreConversations, ...simulationConversations];
    }, [firestoreConversations, simulationConversations]);

    const activeConversation = useMemo(() => {
        return conversations.find(c => c.id === activeConversationId) || null;
    }, [conversations, activeConversationId]);
    
    const setActiveConversationAndRead = useCallback(async (id: string | null) => {
        setActiveConversationId(id);
        const conv = conversations.find(c => c.id === id);
        if (id && conv && !isSimulationVisitorId(conv.visitorId)) {
            try {
                const convRef = doc(db, 'conversations', id);
                await updateDoc(convRef, { isRead: true });
            } catch (error) {
                console.error("Error marking conversation as read:", error);
            }
        }
    }, [conversations]);

    // Helper to get the opening message string safely, regardless of whether it's the old string or new object format
    const getOpeningMessageText = useCallback(() => {
        if (!activeBot) return '';
        const opening = activeBot.settings.personality.openingMessage;
        if (typeof opening === 'string') return opening;
        const botLanguage = activeBot.settings.behavior.language || 'fi';
        return opening?.[botLanguage] || opening?.fi || ''; 
    }, [activeBot]);

    const getOrCreateConversation = useCallback(async (visitorId: string): Promise<Conversation> => {
        if (!activeBot) throw new Error("No active bot selected");

        if (pendingCreations.current[visitorId]) {
            return pendingCreations.current[visitorId];
        }

        if (isSimulationVisitorId(visitorId)) {
            const existingSim = simulationConversations.find(c => c.visitorId === visitorId && !c.isEnded);
            if (existingSim) return existingSim;

            const openingMessage = getOpeningMessageText();
            const newSimConversation: Conversation = {
                id: `sim_conv_${generateId()}`,
                botId: activeBot.id,
                visitorId: visitorId,
                visitorName: `Vierailija ${Math.floor(Math.random() * 900) + 100}`,
                messages: openingMessage ? [{ id: generateId(), text: openingMessage, sender: 'bot', timestamp: new Date().toISOString() }] : [],
                isRead: true,
                isEnded: false,
                agentId: null,
                status: 'pending',
            };
            setSimulationConversations(prev => [...prev, newSimConversation]);
            return newSimConversation;
        }

        const existingLocal = firestoreConversations.find(c => c.visitorId === visitorId && c.botId === activeBot.id && !c.isEnded);
        if (existingLocal) return existingLocal;

        const creationPromise = (async () => {
            try {
                const conversationsCollection = collection(db, 'conversations').withConverter(conversationConverter);
                const q = query(conversationsCollection, where("visitorId", "==", visitorId), where("botId", "==", activeBot.id), where("isEnded", "==", false), limit(1));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    return querySnapshot.docs[0].data();
                }

                const openingMessage = getOpeningMessageText();
                const newConversationData: Omit<Conversation, 'id'> = {
                    botId: activeBot.id,
                    visitorId: visitorId,
                    visitorName: `Vierailija ${Math.floor(Math.random() * 900) + 100}`,
                    messages: openingMessage ? [{ id: generateId(), text: openingMessage, sender: 'bot', timestamp: new Date().toISOString() }] : [],
                    isRead: true,
                    isEnded: false,
                    agentId: null,
                    status: 'pending',
                };
                
                const docRef = await addDoc(collection(db, 'conversations'), newConversationData);
                return sanitizeForState<Conversation>({ id: docRef.id, ...newConversationData });
            } finally {
                delete pendingCreations.current[visitorId];
            }
        })();

        pendingCreations.current[visitorId] = creationPromise;
        return creationPromise;

    }, [activeBot, firestoreConversations, simulationConversations, getOpeningMessageText]);

    const startNewConversation = useCallback(async (visitorId: string): Promise<Conversation | undefined> => {
        if (!activeBot) return;

        if (isSimulationVisitorId(visitorId)) {
            setSimulationConversations(prev => prev.filter(c => c.visitorId !== visitorId));
            return getOrCreateConversation(visitorId);
        }

        const oldConv = firestoreConversations.find(c => c.visitorId === visitorId && c.botId === activeBot.id && !c.isEnded);
        if (oldConv) {
            await updateDoc(doc(db, 'conversations', oldConv.id), { isEnded: true });
        }
        return getOrCreateConversation(visitorId);
    }, [activeBot, firestoreConversations, getOrCreateConversation]);

    const addMessage = useCallback(async (visitorId: string, message: Message): Promise<string | null> => {
        if (!activeBot) return null;

        if (isSimulationVisitorId(visitorId)) {
            let targetConversationId: string;
            const existingSim = simulationConversations.find(c => c.visitorId === visitorId && !c.isEnded);
            
            if (existingSim) {
                targetConversationId = existingSim.id;
            } else {
                targetConversationId = `sim_conv_${generateId()}`;
            }

            // Translate opening message if needed (before setState)
            let openingMessage = getOpeningMessageText();
            if (adminLanguage === 'en' && openingMessage) {
                try {
                    openingMessage = await translateText(openingMessage, 'en');
                } catch (error) {
                    console.error('Translation of opening message failed:', error);
                }
            }

            setSimulationConversations(prev => {
                const existing = prev.find(c => c.visitorId === visitorId && !c.isEnded);
                
                if (existing) {
                    return prev.map(conv => 
                        conv.id === existing.id ? { ...conv, messages: [...conv.messages, message] } : conv
                    );
                } else {
                    const newConv: Conversation = {
                        id: targetConversationId,
                        botId: activeBot.id,
                        visitorId: visitorId,
                        visitorName: `Vierailija ${Math.floor(Math.random() * 900) + 100}`,
                        messages: openingMessage 
                            ? [{ id: generateId(), text: openingMessage, sender: 'bot', timestamp: new Date().toISOString() }, message]
                            : [message],
                        isRead: false,
                        isEnded: false,
                        agentId: null,
                        status: 'pending',
                    };
                    return [...prev, newConv];
                }
            });
            
            return targetConversationId;
        }

        const conversation = await getOrCreateConversation(visitorId);
        if (!conversation) return null;

        const sanitizedMessage = sanitizeForState(message);

        const updatePayload: any = {
             messages: arrayUnion(sanitizedMessage)
        };

        if (message.sender === 'user') {
            updatePayload.isRead = false;
        }
        
        await updateDoc(doc(db, 'conversations', conversation.id), updatePayload);
        return conversation.id;
    }, [activeBot, getOrCreateConversation, simulationConversations, getOpeningMessageText, adminLanguage]);

    const updateMessageContent = useCallback(async (conversationId: string, messageId: string, newContent: string) => {
        if (isSimulationConversationId(conversationId)) {
             setSimulationConversations(prev => prev.map(c => {
                 if (c.id === conversationId) {
                     const updatedMessages = c.messages.map(msg => msg.id === messageId ? { ...msg, text: newContent } : msg);
                     return { ...c, messages: updatedMessages };
                 }
                 return c;
             }));
             return;
        } 
        
        try {
            const convRef = doc(db, 'conversations', conversationId).withConverter(conversationConverter);
            const convDoc = await getDoc(convRef);
            
            if (convDoc.exists()) {
                const latestMessages = convDoc.data().messages;
                const updatedMessages = latestMessages.map(msg => msg.id === messageId ? { ...msg, text: newContent } : msg);
                await updateDoc(convRef, { messages: updatedMessages });
            }
        } catch (e) {
            console.error("Error updating message content in DB", e);
        }
    }, []);

    const endStream = useCallback(async (conversationId: string, messageId: string) => {
        if (isSimulationConversationId(conversationId)) {
             setSimulationConversations(prev => prev.map(c => {
                 if (c.id === conversationId) {
                     const updatedMessages = c.messages.map(msg => msg.id === messageId ? { ...msg, isStreaming: false } : msg);
                     return { ...c, messages: updatedMessages };
                 }
                 return c;
             }));
             return;
        } 

        try {
            const convRef = doc(db, 'conversations', conversationId).withConverter(conversationConverter);
            const convDoc = await getDoc(convRef);
            
            if (convDoc.exists()) {
                const latestMessages = convDoc.data().messages;
                const updatedMessages = latestMessages.map(msg => msg.id === messageId ? { ...msg, isStreaming: false } : msg);
                await updateDoc(convRef, { messages: updatedMessages });
            }
        } catch (e) {
            console.error("Error ending stream in DB", e);
        }
    }, []);
    
    const updateVisitorName = useCallback(async (visitorId: string, name: string) => {
        if (!activeBot) return;

        if (isSimulationVisitorId(visitorId)) {
            setSimulationConversations(prev => prev.map(conv =>
                (conv.visitorId === visitorId && !conv.isEnded) ? { ...conv, visitorName: name } : conv
            ));
            return;
        }

        const conversationsCollection = collection(db, 'conversations');
        const q = query(
            conversationsCollection,
            where("visitorId", "==", visitorId),
            where("botId", "==", activeBot.id),
            where("isEnded", "==", false),
            limit(1)
        );

        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const convDoc = querySnapshot.docs[0];
                await updateDoc(doc(db, 'conversations', convDoc.id), { visitorName: name });
            }
        } catch (error) {
            console.error("Error updating visitor name:", error);
        }
    }, [activeBot]);

    const markAgentJoined = useCallback(async (conversationId: string, agentId: string, agentName: string) => {
        const systemMessage = `${agentName} on liittynyt keskusteluun.`;
        const newMessage: Message = { id: generateId(), text: systemMessage, sender: 'system', timestamp: new Date().toISOString() };
        
        if (isSimulationConversationId(conversationId)) {
            setSimulationConversations(prev => prev.map(c => {
                 if (c.id === conversationId) {
                     return { ...c, agentId, messages: [...c.messages, newMessage] };
                 }
                 return c;
             }));
             return;
        }
        
        await updateDoc(doc(db, 'conversations', conversationId), { 
            agentId, 
            messages: arrayUnion(newMessage) 
        });
    }, []);

    const agentLeaveConversation = useCallback(async (conversationId: string, agentName: string) => {
        const systemMessage = `${agentName} on poistunut keskustelusta.`;
        const newMessage: Message = { id: generateId(), text: systemMessage, sender: 'system', timestamp: new Date().toISOString() };
        
        if (isSimulationConversationId(conversationId)) {
             setSimulationConversations(prev => prev.map(c => {
                 if (c.id === conversationId) {
                     return { ...c, agentId: null, messages: [...c.messages, newMessage] };
                 }
                 return c;
             }));
             return;
        }

         await updateDoc(doc(db, 'conversations', conversationId), { 
            agentId: null, 
            messages: arrayUnion(newMessage) 
        });
    }, []);

    const archiveConversation = useCallback(async (conversationId: string) => {
        if (isSimulationConversationId(conversationId)) {
            setSimulationConversations(prev => prev.filter(c => c.id !== conversationId));
            return;
        }
        
        await updateDoc(doc(db, 'conversations', conversationId), { isEnded: true });
    }, []);

    const addSubmission = useCallback(async (conversationId: string, type: 'contact' | 'quote', data: Record<string, string>) => {
        if (!activeBot) return;
        
        const currentConv = conversations.find(c => c.id === conversationId);

        // Sanitize data to remove undefined values
        const sanitizedData: Record<string, string> = {};
        for (const key in data) {
             if (data[key] !== undefined && data[key] !== null) {
                 sanitizedData[key] = String(data[key]);
             }
        }
        
        const submission: Submission = {
            id: generateId(),
            botId: activeBot.id,
            conversationId,
            visitorId: currentConv?.visitorId || 'unknown',
            visitorName: currentConv?.visitorName || 'Vierailija',
            type,
            data: sanitizedData,
            createdAt: new Date().toISOString(),
            isHandled: false
        };

        // Handle simulation conversations in local state
        if (isSimulationConversationId(conversationId)) {
            setSimulationConversations(prev => prev.map(conv => 
                conv.id === conversationId 
                    ? { ...conv, submissions: [...(conv.submissions || []), submission] }
                    : conv
            ));
            return;
        }

        try {
            
            // Only write to the conversation document to avoid permission issues
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                submissions: arrayUnion(submission)
            });
            
        } catch (error) {
            console.error("Error saving submission:", error);
        }
    }, [activeBot, conversations]);

    const updateSubmissionStatus = useCallback(async (conversationId: string, submissionId: string, isHandled: boolean) => {
        if (isSimulationConversationId(conversationId)) return;

        try {
            const convRef = doc(db, 'conversations', conversationId).withConverter(conversationConverter);
            const convDoc = await getDoc(convRef);
            
            if (convDoc.exists()) {
                const data = convDoc.data();
                if (data.submissions) {
                    const updatedSubmissions = data.submissions.map(sub => 
                        sub.id === submissionId ? { ...sub, isHandled } : sub
                    );
                    await updateDoc(convRef, { submissions: updatedSubmissions });
                }
            }
        } catch (error) {
            console.error("Error updating submission status:", error);
        }
    }, []);

    const updateConversationStatus = useCallback(async (conversationId: string, status: 'pending' | 'handled') => {
        if (isSimulationConversationId(conversationId)) {
            setSimulationConversations(prev => prev.map(c => 
                c.id === conversationId ? { ...c, status } : c
            ));
            return;
        }

        try {
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, { status });
        } catch (error) {
            console.error("Error updating conversation status:", error);
        }
    }, []);

    return {
        conversations,
        activeConversation,
        setActiveConversationId: setActiveConversationAndRead,
        addMessage,
        updateMessageContent,
        endStream,
        getOrCreateConversation,
        updateVisitorName,
        markAgentJoined,
        agentLeaveConversation,
        archiveConversation,
        startNewConversation,
        addSubmission,
        updateSubmissionStatus,
        updateConversationStatus,
    };
};
