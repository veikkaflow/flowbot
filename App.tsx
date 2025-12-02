
import React, { useMemo } from 'react';
import { BotProvider } from './context/BotContext.tsx';
import { ConversationProvider } from './context/ConversationContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { UserProvider, useUserContext } from './context/UserContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import MainLayout from './components/MainLayout.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import NotificationHost from './components/NotificationHost.tsx';
import { useBotContext } from './context/BotContext.tsx';
import BotSelectorScreen from './components/BotSelectorScreen.tsx';
import SetupWizard from './components/SetupWizard.tsx';
import PublicWidgetLoader from './components/PublicWidgetLoader.tsx';
import { auth } from './services/firebase.ts';
import { signOut } from 'firebase/auth';

const AdminAppContent: React.FC = () => {
    const { user, loading } = useUserContext();
    const { bots, activeBot, addBot, isInitialized, isCreatingBot, cancelCreatingBot } = useBotContext();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // UserContext will automatically update and show LoginScreen
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading || !isInitialized) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#141414]">
                {/* Could add a spinner here */}
            </div>
        );
    }

    if (!user) {
        return <LoginScreen logoUrl="" />;
    }

    if (bots.length === 0 || isCreatingBot) {
        return (
            <SetupWizard 
                onSetupComplete={addBot} 
                onCancel={bots.length > 0 ? cancelCreatingBot : undefined}
                onLogout={handleLogout}
            />
        );
    }
    
    if (!activeBot) {
         return <BotSelectorScreen onLogout={handleLogout} />;
    }

    return <MainLayout onLogout={handleLogout} />;
};

const App: React.FC = () => {
    // Check for widget mode params
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const botId = searchParams.get('botId');

    // If we are in widget mode, render the public loader directly.
    // This bypasses the UserProvider/Authentication check entirely.
    if (mode === 'widget' && botId) {
        return <PublicWidgetLoader botId={botId} />;
    }

    // Default Admin Application
    return (
        <LanguageProvider>
            <UserProvider>
                <BotProvider>
                    <ConversationProvider>
                        <NotificationProvider>
                            <AdminAppContent />
                            <NotificationHost />
                        </NotificationProvider>
                    </ConversationProvider>
                </BotProvider>
            </UserProvider>
        </LanguageProvider>
    );
};

export default App;
