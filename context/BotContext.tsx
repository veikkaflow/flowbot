import React, { createContext, useContext, ReactNode } from 'react';
import { useBotManager } from '../hooks/useBotManager.ts';
import { Bot } from '../types.ts';

interface BotContextType {
  bots: Bot[];
  activeBot: Bot | null;
  setActiveBotId: (id: string | null) => void;
  addBot: (bot: Omit<Bot, 'id'>) => void;
  updateBot: (bot: Bot) => void;
  deleteBot: (id: string) => void;
  isInitialized: boolean;
  isCreatingBot: boolean;
  startCreatingBot: () => void;
  cancelCreatingBot: () => void;
}

export const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const botManager = useBotManager();

  return (
    <BotContext.Provider value={botManager}>
      {children}
    </BotContext.Provider>
  );
};

export const useBotContext = () => {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBotContext must be used within a BotProvider');
  }
  return context;
};