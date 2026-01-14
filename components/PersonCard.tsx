// components/PersonCard.tsx
import React from 'react';
import { Mail, Phone, WhatsApp } from './Icons.tsx';

interface PersonCardProps {
    name: string;
    avatar?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
}

export const PersonCard: React.FC<PersonCardProps> = ({ name, avatar, email, phone, whatsapp }) => {
    const hasLinks = email || phone || whatsapp;

    return (
        <div className="w-full bg-[var(--chat-bubble-bot-bg)] rounded-xl p-4 my-2 border border-[var(--chat-border-color)]">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                {avatar && (
                    <img 
                        src={avatar} 
                        alt={name}
                        className="w-16 h-16 rounded-full flex-shrink-0 object-cover"
                    />
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[var(--chat-text-primary)] mb-2 text-base">
                        {name}
                    </h4>
                    
                    {/* Links */}
                    {hasLinks && (
                        <div className="flex flex-wrap gap-3 mt-3">
                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--chat-input-bg)] hover:bg-[var(--chat-button-bg)] rounded-lg text-sm text-[var(--chat-text-primary)] transition-colors border border-[var(--chat-border-color)]"
                                    title={`Email: ${email}`}
                                >
                                    <Mail className="w-4 h-4 text-[var(--color-primary)]" />
                                    <span className="truncate max-w-[200px]">{email}</span>
                                </a>
                            )}
                            
                            {phone && (
                                <a
                                    href={`tel:${phone.replace(/\s/g, '')}`}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--chat-input-bg)] hover:bg-[var(--chat-button-bg)] rounded-lg text-sm text-[var(--chat-text-primary)] transition-colors border border-[var(--chat-border-color)]"
                                    title={`Puhelin: ${phone}`}
                                >
                                    <Phone className="w-4 h-4 text-[var(--color-primary)]" />
                                    <span className="truncate max-w-[200px]">{phone}</span>
                                </a>
                            )}
                            
                            {whatsapp && (
                                <a
                                    href={`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--chat-input-bg)] hover:bg-[var(--chat-button-bg)] rounded-lg text-sm text-[var(--chat-text-primary)] transition-colors border border-[var(--chat-border-color)]"
                                    title={`WhatsApp: ${whatsapp}`}
                                >
                                    <WhatsApp className="w-4 h-4 text-[var(--color-primary)]" />
                                    <span className="truncate max-w-[200px]">WhatsApp</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

