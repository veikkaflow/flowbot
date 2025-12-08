import React, { useEffect, useRef } from 'react';

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
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Palauta kaikkien nappien tyylit oikeaan tilaan, kun currentView muuttuu
  useEffect(() => {
    views.forEach(view => {
      const button = buttonRefs.current[view.id];
      if (button) {
        if (currentView === view.id) {
          button.style.backgroundColor = 'var(--color-primary)';
          button.style.color = 'black';
          button.style.opacity = '1';
        } else {
          button.style.backgroundColor = 'transparent';
          button.style.color = 'var(--admin-text-secondary, #d1d5db)';
          button.style.opacity = '1';
        }
      }
    });
  }, [currentView, views]);
  return (
    <nav className="flex flex-col space-y-1">
      {views.map((view) => (
        <button
          key={view.id}
          ref={(el) => { buttonRefs.current[view.id] = el; }}
          onClick={() => onSwitchView(view.id)}
          title={isCollapsed ? view.name : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
            isCollapsed ? 'justify-center' : ''
          }`}
          style={{
            backgroundColor: currentView === view.id ? 'var(--color-primary)' : 'transparent',
            color: currentView === view.id 
              ? 'black' 
              : 'var(--admin-text-secondary, #d1d5db)',
            opacity: '1'
          }}
          onMouseEnter={(e) => {
            if (currentView !== view.id) {
              e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #374151)';
              e.currentTarget.style.opacity = '0.5';
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== view.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          <view.icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">{view.name}</span>}
        </button>
      ))}
    </nav>
  );
};

export default ViewSwitcher;