
import React, { useMemo, useState, useEffect } from 'react';
import { BotProvider } from './context/BotContext.tsx';
import { ConversationProvider } from './context/ConversationContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { UserProvider, useUserContext } from './context/UserContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import MainLayout from './components/MainLayout.tsx';
import LoginScreen from './components/LoginScreen.tsx';
import NotificationHost from './components/NotificationHost.tsx';
import { useBotContext } from './context/BotContext.tsx';
import BotSelectorScreen from './components/BotSelectorScreen.tsx';
import SetupWizard from './components/SetupWizard.tsx';
import PublicWidgetLoader from './components/PublicWidgetLoader.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { auth, db } from './services/firebase.ts';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AdminAppContent: React.FC = () => {
    const { user, loading } = useUserContext();
    const { bots, activeBot, addBot, isInitialized, isCreatingBot, cancelCreatingBot, setActiveBotId } = useBotContext();
    const [userRole, setUserRole] = useState<'superadmin' | 'admin' | 'agent' | 'viewer' | null>(null);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkUserRole = async () => {
            if (!user?.uid) {
                setCheckingRole(false);
                return;
            }
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserRole(data.role || 'agent');
                } else {
                    setUserRole('agent');
                }
            } catch (error) {
                console.error('Error checking user role:', error);
                setUserRole('agent');
            } finally {
                setCheckingRole(false);
            }
        };
        checkUserRole();
    }, [user?.uid]);

    // Set first bot as active automatically for admin/superadmin users
    useEffect(() => {
        if ((userRole === 'admin' || userRole === 'superadmin') && !activeBot && bots.length > 0) {
            setActiveBotId(bots[0].id);
        }
    }, [userRole, activeBot, bots, setActiveBotId]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // UserContext will automatically update and show LoginScreen
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading || !isInitialized || checkingRole) {
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
    
    // Admin and superadmin users don't need to select a bot - they see all bots directly
    if (userRole === 'admin' || userRole === 'superadmin') {
        return <MainLayout onLogout={handleLogout} isAdmin={true} />;
    }
    
    // Non-admin users need to select a bot
    if (!activeBot) {
         return <BotSelectorScreen onLogout={handleLogout} />;
    }

    return <MainLayout onLogout={handleLogout} isAdmin={false} />;
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
        <ErrorBoundary>
            <ThemeProvider>
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
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App;
