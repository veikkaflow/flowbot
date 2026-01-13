import React from 'react';
import { formatDateSeparator } from '../../utils/time.ts';
import { Language } from '../../data/translations.ts';

interface DateSeparatorProps {
  timestamp: string;
  language: Language;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ timestamp, language }) => {
  return (
    <div className="py-2 text-center">
      <span className="px-2 py-1 text-xs text-[var(--chat-text-muted)] bg-[var(--chat-button-bg)] rounded-full">
        {formatDateSeparator(timestamp, language)}
      </span>
    </div>
  );
};

