import React from 'react';
import { ChevronsUpDown, ArrowDown, Cog } from '../Icons.tsx';
import { ChatSettingsMenu } from './ChatSettingsMenu.tsx';

interface ChatHeaderProps {
  brandName: string;
  botAvatar: string;
  isOnline: boolean;
  onlineText: string;
  offlineText: string;
  chatSize: 'small' | 'medium' | 'large';
  onToggleSize: () => void;
  onClose: () => void;
  showSettingsMenu: boolean;
  onToggleSettingsMenu: () => void;
  onStartNewConversation: () => void;
  onShowHelp: () => void;
  onEditName: () => void;
  startNewText: string;
  helpText: string;
  changeNameText: string;
  themeMode: 'light' | 'dark';
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  brandName,
  botAvatar,
  isOnline,
  onlineText,
  offlineText,
  chatSize,
  onToggleSize,
  onClose,
  showSettingsMenu,
  onToggleSettingsMenu,
  onStartNewConversation,
  onShowHelp,
  onEditName,
  startNewText,
  helpText,
  changeNameText,
  themeMode,
}) => {
  return (
    <header className="flex-shrink-0 p-2 flex items-center justify-between text-[var(--chat-header-text)]" style={{ backgroundColor: 'var(--header-bg)' }}>
      <div className="flex items-center gap-2">
        <img 
          src={botAvatar} 
          alt="bot" 
          className="w-8 h-8 rounded-full flex-shrink-0" 
          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
        />
        <div>
          <h3 className="font-bold text-sm">{brandName}</h3>
          <p className="text-xs opacity-80">{isOnline ? onlineText : offlineText}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggleSize} title="Vaihda kokoa" className="p-1 text-current/80 hover:text-current">
          <ChevronsUpDown className="w-4 h-4"/>
        </button>
        <ChatSettingsMenu
          show={showSettingsMenu}
          onToggle={onToggleSettingsMenu}
          onStartNewConversation={onStartNewConversation}
          onShowHelp={onShowHelp}
          onEditName={onEditName}
          startNewText={startNewText}
          helpText={helpText}
          changeNameText={changeNameText}
          themeMode={themeMode}
        />
        <button 
          onClick={onClose} 
          title="Pienennä" 
          className="p-1 text-[var(--chat-header-text)]/80 hover:text-[var(--chat-header-text)] transition-colors"
          style={{ color: 'inherit', zIndex: 10 }}
        >
          <ArrowDown className="w-4 h-4"/>
        </button>
      </div>
    </header>
  );
};

