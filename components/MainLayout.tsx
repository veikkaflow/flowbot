
import React, { useState, useEffect } from 'react';
import BotSelector from './BotSelector.tsx';
import TopLevelViewSwitcher, { LayoutView } from './TopLevelViewSwitcher.tsx';
import AdminView from './AdminView.tsx';
import CustomerView from './CustomerView.tsx';
import SimulationControls from './SimulationControls.tsx';
import LanguageSelector from './LanguageSelector.tsx';
import ThemeSelector from './ThemeSelector.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { generateId } from '../utils/id.ts';
import BackgroundAnimation from './BackgroundAnimation.tsx';

interface MainLayoutProps {
  onLogout: () => void;
  isAdmin?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout, isAdmin = false }) => {
    const [layoutView, setLayoutView] = useState<LayoutView>('split');
    // We reuse the 'simulations' state to track all open chat windows (both sim and live)
    const [simulations, setSimulations] = useState<string[]>(['sim_visitor_main']);
    const [simulationSizes, setSimulationSizes] = useState<Record<string, 'normal' | 'large'>>({});
    const { activeBot } = useBotContext();

    const addSimulation = () => {
        // IDs starting with 'sim_' are intercepted by logic and NOT saved to DB
        setSimulations(prev => [...prev, `sim_${generateId()}`]);
    };

    const addLiveChat = () => {
        // IDs NOT starting with 'sim_' will be treated as real visitors and saved to Firestore
        setSimulations(prev => [...prev, `live_test_${generateId()}`]);
    };

    const removeSimulation = (visitorId: string) => {
        setSimulations(prev => prev.filter(id => id !== visitorId));
        setSimulationSizes(prev => {
            const newSizes = { ...prev };
            delete newSizes[visitorId];
            return newSizes;
        });
    };
    
    const handleSimulationSizeChange = (visitorId: string, size: 'normal' | 'large') => {
        setSimulationSizes(prev => ({ ...prev, [visitorId]: size }));
    };

    // Tyhjennä simulations-lista kun bot vaihtuu
    useEffect(() => {
        setSimulations(['sim_visitor_main']); // Säilytetään oletussimulaatio
        setSimulationSizes({});
    }, [activeBot?.id]);

    // For non-admin users, activeBot is required
    if (!isAdmin && !activeBot) {
        return null; // Or a loading state
    }
    
    // For admin users, if no active bot is set, wait for App.tsx to set it
    if (isAdmin && !activeBot) {
        return null; // Will be handled by App.tsx
    }

    const primaryColorStyle = activeBot ? {
        '--color-primary': activeBot.settings.appearance.primaryColor,
    } as React.CSSProperties : {} as React.CSSProperties;

    const headerStyle = activeBot?.settings.appearance.headerColor 
        ? { backgroundColor: activeBot.settings.appearance.headerColor }
        : { backgroundColor: 'var(--admin-header-bg, #1f2937)' };

    return (
        <div className="flex flex-col h-screen relative" style={{ 
            backgroundColor: 'var(--admin-bg, #141414)',
            color: 'var(--admin-text-primary, #f3f4f6)',
            ...primaryColorStyle 
        }}>
            <BackgroundAnimation animation={activeBot?.settings.appearance.backgroundAnimation} />
            <header className="flex-shrink-0 flex items-center justify-between p-4 backdrop-blur-sm border-b z-30 gap-4" style={{
                ...headerStyle,
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <div className="flex items-center gap-4">
                    <BotSelector onLogout={onLogout} />
                    <LanguageSelector />
                    <ThemeSelector />
                </div>
                <div className="flex items-center gap-4">
                    <TopLevelViewSwitcher currentView={layoutView} onSwitchView={setLayoutView} />
                    <SimulationControls onAddSimulation={addSimulation} onAddLiveChat={addLiveChat} />
                </div>
            </header>
            
            <main className="flex-grow flex p-4 gap-4 overflow-hidden z-10">
                {layoutView !== 'customer' && (
                    <div className={layoutView === 'split' ? 'w-1/2 relative' : 'w-full relative'}>
                        <div className="absolute inset-0">
                           <AdminView />
                        </div>
                    </div>
                )}
                
                {layoutView !== 'admin' && (
                    <div className={`flex flex-col gap-4 overflow-y-auto ${layoutView === 'split' ? 'w-1/2' : 'w-full'}`}>
                        {simulations.map(visitorId => {
                            const size = simulationSizes[visitorId] || 'normal';
                            const containerHeightClass = size === 'large' ? 'h-[90vh]' : 'h-[720px]';
                            const isLive = !visitorId.startsWith('sim_');
                            
                            return (
                                <div key={visitorId} className={`${containerHeightClass} flex-shrink-0 transition-all duration-300 ease-in-out relative`}>
                                    {isLive && (
                                        <div className="absolute -top-3 left-4 z-50 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                                            Live Database Connection
                                        </div>
                                    )}
                                    <CustomerView 
                                        visitorId={visitorId} 
                                        onClose={() => removeSimulation(visitorId)}
                                        onSizeChange={(newSize) => handleSimulationSizeChange(visitorId, newSize)}
                                    />
                                </div>
                            );
                        })}
                         {simulations.length === 0 && (
                            <div className="flex items-center justify-center h-full bg-gray-800/50 rounded-lg border border-dashed border-gray-600">
                                <p className="text-gray-500">Lisää simulaatio tai live-testi nähdäksesi asiakasnäkymän.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MainLayout;
