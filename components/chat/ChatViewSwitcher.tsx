import React from 'react';
import { ArrowLeft } from '../Icons.tsx';
import ContactForm from '../ContactForm.tsx';
import QuoteForm from '../QuoteForm.tsx';

type ActiveView = 'chat' | 'contact' | 'quote' | 'editName' | 'help';

interface ChatViewSwitcherProps {
  activeView: ActiveView;
  onBack: () => void;
  // Contact view props
  onContactSubmit: (data: { name: string; email: string; message: string }) => Promise<void>;
  contactInitialName?: string;
  // Quote view props
  onQuoteSubmit: (data: { name: string; email: string; company?: string; details: string }) => Promise<void>;
  quoteInitialName?: string;
  // Edit name view props
  newName: string;
  onNewNameChange: (name: string) => void;
  onNameSubmit: (e: React.FormEvent) => void;
  nameChangeTitle: string;
  newNameLabel: string;
  saveText: string;
  // Help view props
  helpText?: string;
  // Language
  language: 'fi' | 'en';
}

export const ChatViewSwitcher: React.FC<ChatViewSwitcherProps> = ({
  activeView,
  onBack,
  onContactSubmit,
  contactInitialName,
  onQuoteSubmit,
  quoteInitialName,
  newName,
  onNewNameChange,
  onNameSubmit,
  nameChangeTitle,
  newNameLabel,
  saveText,
  helpText,
  language,
}) => {
  if (activeView === 'contact') {
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        <ContactForm
          onBack={onBack}
          onSubmit={onContactSubmit}
          initialName={contactInitialName}
          language={language}
        />
      </div>
    );
  }

  if (activeView === 'quote') {
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        <QuoteForm
          onBack={onBack}
          onSubmit={onQuoteSubmit}
          initialName={quoteInitialName}
          language={language}
        />
      </div>
    );
  }

  if (activeView === 'editName') {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <button onClick={onBack} className="text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] p-1 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">{nameChangeTitle}</h3>
        </div>
        <form onSubmit={onNameSubmit} className="space-y-4 flex-grow flex flex-col">
          <div>
            <label htmlFor="newName" className="block text-sm font-medium text-[var(--chat-text-secondary)]">{newNameLabel}</label>
            <input 
              type="text" 
              name="newName" 
              id="newName" 
              required 
              value={newName} 
              onChange={(e) => onNewNameChange(e.target.value)} 
              className="mt-1 w-full text-sm px-4 py-2 bg-[var(--chat-input-bg)] text-[var(--chat-text-primary)] border border-[var(--chat-border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" 
            />
          </div>
          <div className="flex-grow"></div>
          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 p-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all font-semibold flex-shrink-0" 
            style={{ backgroundImage: `linear-gradient(to right, var(--color-primary), var(--color-primary-light))` }}
          >
            {saveText}
          </button>
        </form>
      </div>
    );
  }

  if (activeView === 'help') {
    return (
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <button onClick={onBack} className="text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] p-1 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">Ohjeet</h3>
        </div>
        <div className="space-y-4 text-[var(--chat-text-primary)]">
          {helpText ? (
            <div className="whitespace-pre-wrap text-sm text-[var(--chat-text-secondary)]">
              {helpText}
            </div>
          ) : (
            <>
              <div>
                <h4 className="font-semibold mb-2">Miten käytän chattia?</h4>
                <p className="text-sm text-[var(--chat-text-secondary)]">
                  Voit kirjoittaa viestejä chat-ikkunaan ja saada automaattisia vastauksia. 
                  Jos tarvitset lisäapua, voit pyytää yhdistämään sinut asiakaspalvelijaan.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Miten aloitan uuden keskustelun?</h4>
                <p className="text-sm text-[var(--chat-text-secondary)]">
                  Klikkaa asetukset-ikonia ja valitse "Aloita uusi keskustelu" aloittaaksesi uuden keskustelun.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Miten vaihdan nimeni?</h4>
                <p className="text-sm text-[var(--chat-text-secondary)]">
                  Klikkaa asetukset-ikonia ja valitse "Vaihda nimi" muuttaaksesi nimesi chattiin.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Miten saan apua?</h4>
                <p className="text-sm text-[var(--chat-text-secondary)]">
                  Jos et löydä vastausta kysymykseesi, voit pyytää yhdistämään sinut asiakaspalvelijaan 
                  tai lähettää yhteydenottopyynnön.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

