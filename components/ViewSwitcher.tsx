import React from 'react';

export interface SwitcherViewItem {
  id: string;
  name: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface ViewSwitcherProps {
  views: SwitcherViewItem[];
  currentView: string;
  onSwitchView: (view: string) => void;
  isCollapsed: boolean;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ views, currentView, onSwitchView, isCollapsed }) => {
  return (
    <nav className="flex flex-col space-y-1">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onSwitchView(view.id)}
          title={isCollapsed ? view.name : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
            isCollapsed ? 'justify-center' : ''
          } ${
            currentView === view.id
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          <view.icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">{view.name}</span>}
        </button>
      ))}
    </nav>
  );
};

export default ViewSwitcher;