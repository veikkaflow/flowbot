
import React, { useState } from 'react';
import { Send, ArrowLeft } from './Icons.tsx';
import { translations, Language } from '../data/translations.ts';

interface ContactFormProps {
    onBack: () => void;
    onSubmit: (data: { name: string; email: string; message: string }) => void;
    initialName?: string;
    language: Language;
}

const ContactForm: React.FC<ContactFormProps> = ({ onBack, onSubmit, initialName, language }) => {
    const [formData, setFormData] = useState({ name: initialName || '', email: '', message: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const t = (key: string) => translations[language][key] || key;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.email && formData.message) {
            onSubmit(formData);
            setIsSubmitted(true);
        }
    };

    if (isSubmitted) {
        return (
            <div className="p-4 text-center h-full flex flex-col justify-center items-center">
                <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">{t('form.success_title')}</h3>
                <p className="text-sm text-[var(--chat-text-secondary)] mt-2">{t('form.success_desc_contact')}</p>
                <button onClick={onBack} className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-light)] hover:underline">
                    <ArrowLeft className="w-4 h-4" />
                    {t('form.back')}
                </button>
            </div>
        );
    }
    
    return (
        <div className="p-4 h-full flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                 <button onClick={onBack} className="text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)] p-1 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-[var(--chat-text-primary)]">{t('chat.contact')}</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col min-h-0 overflow-y-auto">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[var(--chat-text-secondary)]">{t('form.name')}</label>
                    <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 w-full text-sm px-4 py-2 bg-[var(--chat-input-bg)] text-[var(--chat-text-primary)] border border-[var(--chat-border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder-[var(--chat-text-muted)]" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--chat-text-secondary)]">{t('form.email')}</label>
                    <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="mt-1 w-full text-sm px-4 py-2 bg-[var(--chat-input-bg)] text-[var(--chat-text-primary)] border border-[var(--chat-border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder-[var(--chat-text-muted)]" />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[var(--chat-text-secondary)]">{t('form.message')}</label>
                    <textarea name="message" id="message" required rows={5} value={formData.message} onChange={handleChange} className="mt-1 w-full text-sm px-4 py-2 bg-[var(--chat-input-bg)] text-[var(--chat-text-primary)] border border-[var(--chat-border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder-[var(--chat-text-muted)]"></textarea>
                </div>
                 <div className="flex-grow"></div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 p-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all font-semibold flex-shrink-0" style={{ backgroundImage: `linear-gradient(to right, var(--color-primary), var(--color-primary-light))` }}>
                    <Send className="w-5 h-5" />
                    {t('form.submit_contact')}
                </button>
            </form>
        </div>
    );
};

export default ContactForm;
