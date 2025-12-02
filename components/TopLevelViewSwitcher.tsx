
import React from 'react';
import { LayoutColumns, Monitor, Shield } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

export type LayoutView = 'split' | 'customer' | 'admin';

interface TopLevelViewSwitcherProps {
  currentView: LayoutView;
  onSwitchView: (view: LayoutView) => void;
}

const TopLevelViewSwitcher: React.FC<TopLevelViewSwitcherProps> = ({ currentView, onSwitchView }) => {
  const { t } = useLanguage();

  const views: { id: LayoutView, name: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'split', name: t('nav.split_view'), icon: LayoutColumns },
    { id: 'customer', name: t('nav.customer_view'), icon: Monitor },
    { id: 'admin', name: t('nav.admin_view'), icon: Shield },
  ];

  return (
    <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onSwitchView(view.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentView === view.id
              ? 'bg-[var(--color-primary)] text-black'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <view.icon className="w-5 h-5" />
          <span className="hidden xl:inline">{view.name}</span>
        </button>
      ))}
    </div>
  );
};

export default TopLevelViewSwitcher;
