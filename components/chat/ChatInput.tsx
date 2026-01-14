import React from 'react';
import { Send, Mail, Briefcase } from '../Icons.tsx';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder: string;
  showContactButton: boolean;
  showQuoteButton: boolean;
  contactText: string;
  quoteText: string;
  onShowContact: () => void;
  onShowQuote: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  disabled,
  placeholder,
  showContactButton,
  showQuoteButton,
  contactText,
  quoteText,
  onShowContact,
  onShowQuote,
}) => {
  return (
    <div 
      className="flex-shrink-0 p-3 bg-[var(--chat-footer-bg)] border-t border-[var(--chat-border-color)]"
      style={{
        flexShrink: 0,
        padding: '0.75rem',
        backgroundColor: 'var(--chat-footer-bg)',
        borderTop: '1px solid var(--chat-border-color)',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Contact & Quote buttons are always visible if enabled */}
      {(showContactButton || showQuoteButton) && (
        <div 
          className="flex flex-wrap gap-2 mb-2"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            marginTop: 0,
            marginLeft: 0,
            marginRight: 0,
            padding: 0,
          }}
        >
          {showContactButton && (
            <button 
              onClick={onShowContact} 
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--chat-input-bg)] text-sm text-[var(--chat-text-primary)] rounded-full hover:bg-[var(--chat-button-bg)] transition-colors border border-[var(--chat-border-color)]"
            >
              <Mail className="w-4 h-4 text-[var(--color-primary)]" />
              {contactText}
            </button>
          )}
          {showQuoteButton && (
            <button 
              onClick={onShowQuote} 
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--chat-input-bg)] text-sm text-[var(--chat-text-primary)] rounded-full hover:bg-[var(--chat-button-bg)] transition-colors border border-[var(--chat-border-color)]"
            >
              <Briefcase className="w-4 h-4 text-[var(--color-primary)]" />
              {quoteText}
            </button>
          )}
        </div>
      )}
      <form 
        onSubmit={onSubmit} 
        className="flex items-center gap-2"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0,
          padding: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full text-sm px-4 py-2 bg-[var(--chat-input-bg)] text-[var(--chat-text-primary)] border border-[var(--chat-border-color)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder-[var(--chat-text-muted)]"
          style={{
            width: '100%',
            fontSize: '0.875rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            backgroundColor: 'var(--chat-input-bg)',
            color: 'var(--chat-text-primary)',
            border: '1px solid var(--chat-border-color)',
            borderRadius: '9999px',
            margin: 0,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            lineHeight: 'inherit',
          }}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading || disabled} 
          className="p-2.5 text-white rounded-full disabled:opacity-50" 
          style={{ backgroundColor: 'var(--color-primary)'}}
        >
          <Send className="w-5 h-5"/>
        </button>
      </form>
    </div>
  );
};


