// hooks/useBotManager.ts
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../services/firebase.ts';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    updateDoc,
    getDocs
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
    const activeBotIdRef = useRef<string | null>(null);
    const allowedBotUnsubscribesRef = useRef<Map<string, () => void>>(new Map());
    
    // Keep ref in sync with state
    useEffect(() => {
        activeBotIdRef.current = activeBotId;
    }, [activeBotId]);

    useEffect(() => {
        if (!user) {
            setBots([]);
            setIsInitialized(true); 
            return;
        }

        let unsubscribeBots: (() => void) | null = null;
        let unsubscribeUser: (() => void) | null = null;

        // Listen to user document changes to get updated allowedBotIds
        const userDocRef = doc(db, 'users', user.uid);
        
        // Function to load bots based on user data
        const loadBotsForUser = (userData: any) => {
            const userRole = userData?.role || 'agent';
            const allowedBotIds = userData?.allowedBotIds || [];
            const botsCollection = collection(db, 'bots').withConverter(botConverter);
            
            console.log('Loading bots for user:', { 
                uid: user.uid, 
                role: userRole, 
                allowedBotIds,
                hasUserData: !!userData,
                allowedBotIdsCount: allowedBotIds.length
            });
            
            // Debug: Check if specific bot exists (for troubleshooting)
            const DEBUG_BOT_ID = 'P5siUpKoZYhrvz5xkydg';
            if (allowedBotIds.includes(DEBUG_BOT_ID)) {
                console.log(`DEBUG: Bot ${DEBUG_BOT_ID} is in allowedBotIds list`);
            } else {
                console.log(`DEBUG: Bot ${DEBUG_BOT_ID} is NOT in allowedBotIds list. User will only see it if they are admin or owner.`);
            }
            
            if (userRole === 'admin' || userRole === 'superadmin') {
                // Admin sees ALL bots, regardless of allowedBotIds
                // Use getDocs instead of onSnapshot for admin to avoid permission issues
                // We'll set up a polling mechanism or use onSnapshot with proper error handling
                if (unsubscribeBots) unsubscribeBots();
                
                const loadAdminBots = async () => {
                    try {
                        const querySnapshot = await getDocs(botsCollection);
                        const botsFromDb = querySnapshot.docs.map(doc => doc.data());
                        console.log(`Admin: Found ${botsFromDb.length} bots total:`, botsFromDb.map(b => b.name));
                        setBots(botsFromDb);

                        // Set active bot on first load or if current active bot is not in list
                        if (!isInitialized) {
                            const storedBotId = localStorage.getItem(LAST_ACTIVE_BOT_KEY);
                            if (storedBotId && botsFromDb.some(b => b.id === storedBotId)) {
                                setActiveBotIdState(storedBotId);
                            } else if (botsFromDb.length > 0) {
                                setActiveBotIdState(botsFromDb[0].id);
                            }
                            setIsInitialized(true);
                        } else if (activeBotIdRef.current && !botsFromDb.some(b => b.id === activeBotIdRef.current)) {
                            // If current active bot is no longer available, switch to first bot
                            if (botsFromDb.length > 0) {
                                setActiveBotIdState(botsFromDb[0].id);
                            } else {
                                setActiveBotIdState(null);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching bots for admin:", error);
                        setIsInitialized(true);
                    }
                };

                // Load bots immediately
                loadAdminBots();

                // Set up polling to refresh bots every 5 seconds for admin
                // This provides near real-time updates without requiring onSnapshot permissions
                const pollInterval = setInterval(() => {
                    loadAdminBots();
                }, 5000);

                // Store cleanup function
                unsubscribeBots = () => {
                    clearInterval(pollInterval);
                };
            } else {
                 // Non-admin users: get owned bots + allowed bots
                 const ownedBotsQuery = query(botsCollection, where('ownerId', '==', user.uid));
                
                 // Funktio joka asettaa onSnapshot-kuuntelijat allowed botteille
                 const setupAllowedBotListeners = (allowedBotIds: string[]) => {
                     const unsubscribes = allowedBotUnsubscribesRef.current;
                     
                     // Poista vanhat kuuntelijat joita ei enää tarvita
                     const currentBotIds = new Set(allowedBotIds);
                     unsubscribes.forEach((unsubscribe, botId) => {
                         if (!currentBotIds.has(botId)) {
                             unsubscribe();
                             unsubscribes.delete(botId);
                             console.log(`Removed listener for allowed bot ${botId}`);
                         }
                     });
                     
                     // Luo uudet kuuntelijat uusille botteille
                     allowedBotIds.forEach(botId => {
                         if (!unsubscribes.has(botId)) {
                             const botDocRef = doc(db, 'bots', botId).withConverter(botConverter);
                             const unsubscribe = onSnapshot(botDocRef, (botSnapshot) => {
                                 if (botSnapshot.exists()) {
                                     const botData = botSnapshot.data();
                                     console.log(`Allowed bot ${botId} updated in real-time:`, botData.name);
                                     
                                     // Päivitä botti stateen reaaliajassa
                                     setBots(prevBots => {
                                         const existingBot = prevBots.find(b => b.id === botId);
                                         if (existingBot) {
                                             // Päivitä olemassa oleva botti
                                             return prevBots.map(b => b.id === botId ? botData : b);
                                         } else {
                                             // Lisää uusi botti jos se ei ole jo listassa
                                             const isOwned = prevBots.some(b => b.id === botId && b.ownerId === user.uid);
                                             if (!isOwned) {
                                                 return [...prevBots, botData];
                                             }
                                             return prevBots;
                                         }
                                     });
                                 } else {
                                     console.warn(`Allowed bot ${botId} no longer exists`);
                                     // Poista botti stateesta jos se poistettiin
                                     setBots(prevBots => prevBots.filter(b => b.id !== botId));
                                 }
                             }, (error) => {
                                 console.error(`Error listening to allowed bot ${botId}:`, error);
                             });
                             
                             unsubscribes.set(botId, unsubscribe);
                             console.log(`Added real-time listener for allowed bot ${botId}`);
                         }
                     });
                 };
                 
                 // Funktio joka hakee ja yhdistää botit
                 const loadAndCombineBots = async () => {
                     try {
                         // Hae omistetut botit
                         const ownedBotsSnapshot = await getDocs(ownedBotsQuery);
                         const ownedBots = ownedBotsSnapshot.docs.map(doc => doc.data());
                         console.log(`Found ${ownedBots.length} owned bots for user ${user.uid}:`, ownedBots.map(b => ({ id: b.id, name: b.name })));
                         
                         // Hae allowedBotIds uudelleen käyttäjädokumentista, jotta saadaan aina uusin arvo
                         let currentAllowedBotIds: string[] = [];
                         try {
                             const currentUserDoc = await getDoc(userDocRef);
                             if (currentUserDoc.exists()) {
                                 const currentUserData = currentUserDoc.data();
                                 currentAllowedBotIds = currentUserData.allowedBotIds || [];
                                 console.log('Fetched current allowedBotIds from user document:', currentAllowedBotIds);
                             }
                         } catch (error) {
                             console.error('Error fetching current user document for allowedBotIds:', error);
                             // Fallback: käytä vanhaa arvoa jos haku epäonnistuu
                             currentAllowedBotIds = allowedBotIds;
                         }
                         
                         // Aseta onSnapshot-kuuntelijat allowed botteille
                         setupAllowedBotListeners(currentAllowedBotIds);
                         
                         // Hae allowed botit ensimmäisellä kerralla (jotta ne näkyvät heti)
                         let allowedBots: Bot[] = [];
                         const invalidBotIds: string[] = [];
                         if (currentAllowedBotIds.length > 0) {
                             console.log('Fetching allowed bots initially:', currentAllowedBotIds);
                             const allowedBotsPromises = currentAllowedBotIds.map(async (botId: string) => {
                                 try {
                                     const botDoc = await getDoc(doc(db, 'bots', botId).withConverter(botConverter));
                                     if (botDoc.exists()) {
                                         const botData = botDoc.data();
                                         console.log(`Found allowed bot ${botId}:`, { 
                                             name: botData.name, 
                                             ownerId: botData.ownerId,
                                             id: botData.id 
                                         });
                                         return botData;
                                     } else {
                                         console.warn(`Bot ${botId} does not exist in database (checked via allowedBotIds)`);
                                         invalidBotIds.push(botId);
                                         return null;
                                     }
                                 } catch (error) {
                                     console.error(`Error fetching bot ${botId} from allowedBotIds:`, error);
                                     invalidBotIds.push(botId);
                                     return null;
                                 }
                             });
                             const fetchedBots = await Promise.all(allowedBotsPromises);
                             allowedBots = fetchedBots.filter((bot): bot is Bot => bot !== null);
                             console.log(`Successfully fetched ${allowedBots.length} out of ${currentAllowedBotIds.length} allowed bots`);
                             
                             // Clean up invalid bot IDs from user document
                             if (invalidBotIds.length > 0) {
                                 console.warn(`Found ${invalidBotIds.length} invalid bot IDs, cleaning up:`, invalidBotIds);
                                 try {
                                     const validBotIds = currentAllowedBotIds.filter(id => !invalidBotIds.includes(id));
                                     await updateDoc(userDocRef, {
                                         allowedBotIds: validBotIds
                                     });
                                     console.log(`Cleaned up invalid bot IDs from user document. Remaining valid IDs:`, validBotIds);
                                     // Päivitä kuuntelijat uudelleen
                                     setupAllowedBotListeners(validBotIds);
                                 } catch (error) {
                                     console.error('Error cleaning up invalid bot IDs:', error);
                                 }
                             }
                         }
                         
                         // Yhdistä omistetut ja allowed botit
                         const allBots = [...ownedBots];
                         allowedBots.forEach(allowedBot => {
                             if (!allBots.find(b => b.id === allowedBot.id)) {
                                 allBots.push(allowedBot);
                             }
                         });
                         
                         console.log(`Non-admin: Found ${allBots.length} bots (${ownedBots.length} owned + ${allowedBots.length} allowed)`);
                         console.log('All bots:', allBots.map(b => ({ id: b.id, name: b.name, ownerId: b.ownerId })));
                         setBots(allBots);

                         // Set active bot on first load or if current active bot is not in list
                         if (!isInitialized) {
                             const storedBotId = localStorage.getItem(LAST_ACTIVE_BOT_KEY);
                             if (storedBotId && allBots.some(b => b.id === storedBotId)) {
                                 setActiveBotIdState(storedBotId);
                             } else if (allBots.length > 0) {
                                 setActiveBotIdState(allBots[0].id);
                             }
                             setIsInitialized(true);
                         } else if (activeBotIdRef.current && !allBots.some(b => b.id === activeBotIdRef.current)) {
                             // If current active bot is no longer available, switch to first bot
                             if (allBots.length > 0) {
                                 setActiveBotIdState(allBots[0].id);
                             } else {
                                 setActiveBotIdState(null);
                             }
                         }
                     } catch (error) {
                         console.error("Error loading and combining bots:", error);
                         setIsInitialized(true);
                     }
                 };
                 
                 // Kuuntele omistettujen bottien muutoksia
                 if (unsubscribeBots) unsubscribeBots();
                 unsubscribeBots = onSnapshot(ownedBotsQuery, () => {
                     // Kun omistetut botit muuttuvat, lataa botit uudelleen
                     loadAndCombineBots();
                 }, (error) => {
                     console.error("Error fetching bots:", error);
                     setIsInitialized(true); 
                 });
                 
                 // Lataa botit heti ensimmäisellä kerralla
                 loadAndCombineBots();
            }
            
        };

        // Listen to user document changes
        unsubscribeUser = onSnapshot(userDocRef, (userSnapshot) => {
            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                console.log('User document updated:', userData);
                loadBotsForUser(userData);
            } else {
                console.warn('User document does not exist, using default role');
                // If user document doesn't exist, try to load with default role
                loadBotsForUser({ role: 'agent', allowedBotIds: [] });
            }
        }, (error) => {
            console.error("Error listening to user document:", error);
            // Fallback: try to load once
            getDoc(userDocRef).then(doc => {
                if (doc.exists()) {
                    const userData = doc.data();
                    console.log('Fallback: Loaded user data:', userData);
                    loadBotsForUser(userData);
                } else {
                    console.warn('Fallback: User document does not exist');
                    loadBotsForUser({ role: 'agent', allowedBotIds: [] });
                }
            });
        });

        return () => {
            if (unsubscribeBots) {
                unsubscribeBots();
            }
            if (unsubscribeUser) {
                unsubscribeUser();
            }
            // Poista kaikki allowed bot -kuuntelijat
            allowedBotUnsubscribesRef.current.forEach((unsubscribe) => {
                unsubscribe();
            });
            allowedBotUnsubscribesRef.current.clear();
        };
    }, [user?.uid, isInitialized]);

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
            
            // Lisää botin ID käyttäjän allowedBotIds-listaan
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const currentAllowedBotIds = userData.allowedBotIds || [];
                    
                    // Varmista, että botin ID ei ole jo listassa
                    if (!currentAllowedBotIds.includes(docRef.id)) {
                        await updateDoc(userDocRef, {
                            allowedBotIds: [...currentAllowedBotIds, docRef.id]
                        });
                        console.log(`Added bot ${docRef.id} to user's allowedBotIds`);
                    }
                } else {
                    // Jos käyttäjädokumenttia ei ole, luo se
                    await setDoc(userDocRef, {
                        email: user.email || '',
                        role: 'agent',
                        name: user.email?.split('@')[0] || '',
                        allowedBotIds: [docRef.id]
                    });
                    console.log(`Created user document with bot ${docRef.id} in allowedBotIds`);
                }
            } catch (userUpdateError) {
                console.error("Error updating user's allowedBotIds:", userUpdateError);
                // Älä keskeytä botin luomista, vaikka käyttäjän päivitys epäonnistuisi
            }
            
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
            // Use setDoc with merge: true to ensure type compatibility with the converter
            // and full object update logic (toFirestore handles id removal)
            await setDoc(botRef, updatedBot, { merge: true });
        } catch (error) {
            console.error("Error updating bot:", error);
            throw error; // Re-throw to allow error handling in calling code
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