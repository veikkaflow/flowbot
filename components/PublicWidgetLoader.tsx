
import React, { useEffect, useState, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase.ts';
import { botConverter } from '../services/firestoreConverters.ts';
import { Bot } from '../types.ts';
import { BotContext } from '../context/BotContext.tsx';
import { ConversationProvider } from '../context/ConversationContext.tsx';
import { NotificationProvider } from '../context/NotificationContext.tsx';
import { LanguageProvider } from '../context/LanguageContext.tsx';
import NotificationHost from './NotificationHost.tsx';
import ChatWidget from './ChatWidget.tsx';
import { Loader } from './Icons.tsx';
import { generateId } from '../utils/id.ts';

interface PublicWidgetLoaderProps {
    botId: string;
}

// A simplified BotProvider that only provides the active public bot
// and disables admin capabilities.
const PublicBotProvider: React.FC<{ bot: Bot; children: ReactNode }> = ({ bot, children }) => {
    const contextValue = {
        bots: [bot],
        activeBot: bot,
        setActiveBotId: () => {}, // No-op for public widget
        addBot: () => {},
        updateBot: () => {},
        deleteBot: () => {},
        isInitialized: true,
        isCreatingBot: false,
        startCreatingBot: () => {},
        cancelCreatingBot: () => {},
    };

    return (
        <BotContext.Provider value={contextValue}>
            {children}
        </BotContext.Provider>
    );
};

const PublicWidgetLoader: React.FC<PublicWidgetLoaderProps> = ({ botId }) => {
    const [bot, setBot] = useState<Bot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visitorId, setVisitorId] = useState<string | null>(null);

    useEffect(() => {
        // Initialize Visitor ID
        const VISITOR_KEY = `flowbot_visitor_${botId}`;
        let storedId = sessionStorage.getItem(VISITOR_KEY);
        if (!storedId) {
            storedId = generateId();
            sessionStorage.setItem(VISITOR_KEY, storedId);
        }
        setVisitorId(storedId);

        // Fetch Bot Data
        const fetchBot = async () => {
            try {
                const botRef = doc(db, 'bots', botId).withConverter(botConverter);
                const botSnap = await getDoc(botRef);
                
                if (botSnap.exists()) {
                    setBot(botSnap.data());
                } else {
                    setError("Bottia ei löytynyt. Tarkista ID.");
                }
            } catch (err) {
                console.error("Error loading bot:", err);
                setError("Virhe ladattaessa bottia.");
            } finally {
                setLoading(false);
            }
        };

        fetchBot();
    }, [botId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-transparent">
                <Loader className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error || !bot || !visitorId) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 p-4 text-center">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-red-500 font-bold mb-2">Virhe</h3>
                    <p className="text-gray-700">{error || "Tuntematon virhe."}</p>
                </div>
            </div>
        );
    }

    // Apply primary color variable for the widget
    const style = {
        '--color-primary': bot.settings.appearance.primaryColor,
    } as React.CSSProperties;

    return (
        <div style={style}>
            <LanguageProvider>
                <PublicBotProvider bot={bot}>
                    <ConversationProvider>
                        <NotificationProvider>
                            {/* Render ChatWidget directly. It handles its own layout (bubble vs open) */}
                            <ChatWidget visitorId={visitorId} />
                            <NotificationHost />
                        </NotificationProvider>
                    </ConversationProvider>
                </PublicBotProvider>
            </LanguageProvider>
        </div>
    );
};

export default PublicWidgetLoader;
