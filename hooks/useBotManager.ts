// hooks/useBotManager.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../services/firebase.ts';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    setDoc,
    deleteDoc
} from 'firebase/firestore';
import { Bot } from '../types.ts';
import { useUserContext } from '../context/UserContext.tsx';
import { botConverter } from '../services/firestoreConverters.ts'; // IMPORT THE CONVERTER

const LAST_ACTIVE_BOT_KEY = 'flowbot_last_active_bot_id';

export const useBotManager = () => {
    const { user } = useUserContext();
    const [bots, setBots] = useState<Bot[]>([]);
    const [activeBotId, setActiveBotIdState] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isCreatingBot, setIsCreatingBot] = useState(false);

    useEffect(() => {
        if (!user) {
            setBots([]);
            setIsInitialized(true); 
            return;
        }

        // Use the converter with the collection reference
        const botsCollection = collection(db, 'bots').withConverter(botConverter);
        const q = query(botsCollection, where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            // doc.data() now automatically returns a clean, typed, and hydrated Bot object
            const botsFromDb = querySnapshot.docs.map(doc => doc.data());
            setBots(botsFromDb);

            if (!isInitialized) {
                const storedBotId = localStorage.getItem(LAST_ACTIVE_BOT_KEY);
                if (storedBotId && botsFromDb.some(b => b.id === storedBotId)) {
                    setActiveBotIdState(storedBotId);
                } else if (botsFromDb.length > 0) {
                    setActiveBotIdState(botsFromDb[0].id);
                }
                setIsInitialized(true);
            }
        }, (error) => {
            console.error("Error fetching bots:", error);
            setIsInitialized(true); 
        });

        return () => unsubscribe();
    }, [user, isInitialized]);

    const setActiveBotId = useCallback((id: string | null) => {
        setActiveBotIdState(id);
        if (id) {
            localStorage.setItem(LAST_ACTIVE_BOT_KEY, id);
        } else {
            localStorage.removeItem(LAST_ACTIVE_BOT_KEY);
        }
    }, []);

    const activeBot = useMemo(() => {
        return bots.find(bot => bot.id === activeBotId) || null;
    }, [bots, activeBotId]);

    const addBot = useCallback(async (botData: Omit<Bot, 'id'>) => {
        if (!user) throw new Error("User must be logged in to add a bot.");
        try {
            // Use the converted collection ref for adding new documents
            const botsCollection = collection(db, 'bots').withConverter(botConverter);
            const docRef = await addDoc(botsCollection, {
                ...botData,
                ownerId: user.uid
            } as Bot); // Cast to Bot type for the converter
            setActiveBotId(docRef.id);
            setIsCreatingBot(false); // Close wizard after adding
        } catch (error) {
            console.error("Error adding bot:", error);
        }
    }, [user, setActiveBotId]);

    const updateBot = useCallback(async (updatedBot: Bot) => {
        try {
            // Use the converted doc ref for updating
            const botRef = doc(db, 'bots', updatedBot.id).withConverter(botConverter);
            // Use setDoc instead of updateDoc to ensure type compatibility with the converter
            // and full object update logic (toFirestore handles id removal)
            await setDoc(botRef, updatedBot);
        } catch (error) {
            console.error("Error updating bot:", error);
        }
    }, []);

    const deleteBot = useCallback(async (id: string) => {
        try {
            await deleteDoc(doc(db, 'bots', id));
            if (activeBotId === id) {
                const nextBot = bots.find(b => b.id !== id);
                setActiveBotId(nextBot ? nextBot.id : null);
            }
        } catch (error) {
            console.error("Error deleting bot:", error);
        }
    }, [activeBotId, bots, setActiveBotId]);

    const startCreatingBot = useCallback(() => setIsCreatingBot(true), []);
    const cancelCreatingBot = useCallback(() => setIsCreatingBot(false), []);

    return {
        bots,
        activeBot,
        setActiveBotId,
        addBot,
        updateBot,
        deleteBot,
        isInitialized,
        isCreatingBot,
        startCreatingBot,
        cancelCreatingBot
    };
};