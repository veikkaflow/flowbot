
import React, { useState, useCallback } from 'react';
import ViewSwitcher, { SwitcherViewItem } from './ViewSwitcher.tsx';
import DashboardView from './DashboardView.tsx';
import InboxView from './InboxView.tsx';
import LeadsView from './LeadsView.tsx'; // Import LeadsView
import SettingsDashboard from './SettingsDashboard.tsx';
import AnalysisDashboard from './AnalysisDashboard.tsx';
import { Home, Mail, Shield, BarChart2, List } from './Icons.tsx'; // Import List icon
import { AdminView as AdminViewType, SettingsView } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';


const AdminView: React.FC = () => {
    const [currentView, setCurrentView] = useState<AdminViewType>('dashboard');
    const [currentSettingsView, setCurrentSettingsView] = useState<SettingsView>('appearance');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const { t } = useLanguage();

    const handleSwitchView = useCallback((view: AdminViewType, settingsView?: SettingsView) => {
        setCurrentView(view);
        if (settingsView) {
            setCurrentSettingsView(settingsView);
        }
    }, []);

    const views: SwitcherViewItem[] = [
        { id: 'dashboard', name: t('nav.dashboard'), icon: Home },
        { id: 'inbox', name: t('nav.inbox'), icon: Mail },
        { id: 'leads', name: t('nav.leads'), icon: List }, // Added Leads view
        { id: 'settings', name: t('nav.settings'), icon: Shield },
        { id: 'analysis', name: t('nav.reporting'), icon: BarChart2 },
    ];

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView onSwitchView={handleSwitchView} />;
            case 'inbox':
                return <InboxView />;
            case 'leads': // Render LeadsView
                return <LeadsView />;
            case 'settings':
                return <SettingsDashboard initialView={currentSettingsView} />;
            case 'analysis':
                return <AnalysisDashboard />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-full rounded-lg -m-6" style={{ backgroundColor: 'var(--admin-card-bg, #1f2937)' }}>
            <div 
                onMouseEnter={() => setIsSidebarCollapsed(false)} 
                onMouseLeave={() => setIsSidebarCollapsed(true)}
                className="flex-shrink-0"
            >
                <aside className={`h-full p-4 border-r transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`} style={{
                    backgroundColor: 'var(--admin-sidebar-bg, #1f2937)',
                    borderColor: 'var(--admin-border, #374151)'
                }}>
                    <ViewSwitcher 
                        views={views} 
                        currentView={currentView} 
                        onSwitchView={(view) => handleSwitchView(view as AdminViewType)}
                        isCollapsed={isSidebarCollapsed} 
                    />
                </aside>
            </div>
            <main className="flex-1 p-6 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminView;
