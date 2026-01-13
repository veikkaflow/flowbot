import React, { useRef, useEffect } from 'react';
import { RefreshCcw, HelpCircle, User, Settings } from '../Icons.tsx';

interface ChatSettingsMenuProps {
  show: boolean;
  onToggle: () => void;
  onStartNewConversation: () => void;
  onShowHelp: () => void;
  onEditName: () => void;
  startNewText: string;
  helpText: string;
  changeNameText: string;
  themeMode: 'light' | 'dark';
}

export const ChatSettingsMenu: React.FC<ChatSettingsMenuProps> = ({
  show,
  onToggle,
  onStartNewConversation,
  onShowHelp,
  onEditName,
  startNewText,
  helpText,
  changeNameText,
  themeMode,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onToggle]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={onToggle} 
        title="Asetukset" 
        className={`p-1 rounded-md transition-all ${show ? 'bg-[var(--chat-input-bg)] text-current' : 'text-current/80 hover:text-current'}`}
      >
        <Settings className="w-4 h-4"/>
      </button>
      {show && (
        <div 
          className="absolute right-0 mt-2 w-48 border border-[var(--chat-border-color)] rounded-lg shadow-lg z-[100] overflow-hidden backdrop-blur-sm" 
          style={{ 
            backgroundColor: themeMode === 'dark' 
              ? 'rgba(55, 55, 75, 1)' 
              : '#f3f4f6'
          }}
        >
          <button
            onClick={() => {
              onToggle();
              onStartNewConversation();
            }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-button-bg)] flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            {startNewText}
          </button>
          <button
            onClick={() => {
              onToggle();
              onShowHelp();
            }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-button-bg)] flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            {helpText}
          </button>
          <button
            onClick={() => {
              onToggle();
              onEditName();
            }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-button-bg)] flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            {changeNameText}
          </button>
        </div>
      )}
    </div>
  );
};

