import React, { useRef } from 'react';
import { ChevronsUpDown, ArrowDown, Cog } from '../Icons.tsx';
import { ChatSettingsMenu } from './ChatSettingsMenu.tsx';
import { useHostStyleOverride } from '../../hooks/useHostStyleOverride.ts';

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
  // Ref for the header container to apply styles to h1-h6 and p elements
  const headerRef = useRef<HTMLElement>(null);

  // Apply !important styles to override host site CSS
  useHostStyleOverride(
    [headerRef],
    [brandName, isOnline, themeMode],
    { isHeader: true, themeMode }
  );

  return (
    <header 
      ref={headerRef}
      className="flex-shrink-0 p-2 flex items-center justify-between text-[var(--chat-header-text)] bg-[var(--chat-header-bg)] m-0 border-none box-border" 
      style={{ 
        backgroundColor: 'var(--chat-header-bg)',
      }}
    >
      <div className="flex items-center gap-2 m-0 p-0">
        <img 
          src={botAvatar} 
          alt="bot" 
          className="w-8 h-8 rounded-full flex-shrink-0 object-cover block m-0 p-0 border-none" 
        />
        <div className="m-0 p-0">
          <h3 className="font-bold text-sm m-0 p-0 leading-normal text-inherit">
            {brandName}
          </h3>
          <p className="text-xs opacity-80 m-0 mt-0.5 p-0 leading-normal text-inherit">
            {isOnline ? onlineText : offlineText}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 m-0 p-0">
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
          className="p-1 text-[var(--chat-header-text)]/80 hover:text-[var(--chat-header-text)] transition-colors relative z-10"
        >
          <ArrowDown className="w-4 h-4"/>
        </button>
      </div>
    </header>
  );
};


