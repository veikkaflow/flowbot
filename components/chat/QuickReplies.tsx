import React from 'react';
import { QuickReply } from '../../types.ts';
import { IconName } from '../../types.ts';
import * as Icons from '../Icons.tsx';
import { Language } from '../../data/translations.ts';

interface QuickRepliesProps {
  quickReplies: QuickReply[];
  language: Language;
  onQuickReply: (text: string) => void;
}

const getIconComponent = (iconName: IconName): React.FC<React.SVGProps<SVGSVGElement>> => {
  return Icons[iconName] || Icons.HelpCircle;
};

export const QuickReplies: React.FC<QuickRepliesProps> = ({ quickReplies, language, onQuickReply }) => {
  if (!quickReplies || quickReplies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2 justify-start">
      {quickReplies.map(qr => {
        // Get localized text or fallback to FI
        const qrText = (typeof qr.text === 'object' ? qr.text[language] || qr.text.fi : qr.text) as string;
        
        // Skip if text is empty in current language
        if (!qrText) return null;

        const Icon = getIconComponent(qr.icon as IconName);
        return (
          <button 
            key={qr.id} 
            onClick={() => onQuickReply(qrText)} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-sm text-gray-700 rounded-full hover:bg-gray-100 shadow-sm"
          >
            <Icon className="w-4 h-4 text-[var(--color-primary)]" />
            {qrText}
          </button>
        );
      })}
    </div>
  );
};

