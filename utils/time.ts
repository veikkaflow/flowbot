
import { translations, Language } from '../data/translations.ts';

const getTranslation = (lang: Language, key: string): string => {
    return translations[lang]?.[key as keyof typeof translations['fi']] || key;
};

const getLocale = (lang: Language): string => {
    return lang === 'fi' ? 'fi-FI' : 'en-US';
}

export function formatRelativeTime(isoString: string, lang: Language = 'fi'): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return getTranslation(lang, 'time.yesterday');
    
    if (diffDays < 7) return date.toLocaleDateString(getLocale(lang), { weekday: 'short' });

    return date.toLocaleDateString(getLocale(lang));
}

export function formatTime(isoString: string, lang: Language = 'fi'): string {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString(getLocale(lang), {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

export function formatDateSeparator(isoString: string, lang: Language = 'fi'): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return getTranslation(lang, 'time.today');
    if (isSameDay(date, yesterday)) return getTranslation(lang, 'time.yesterday');

    return date.toLocaleDateString(getLocale(lang), {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

export function formatConversationListTime(isoString: string, lang: Language = 'fi'): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) {
        return date.toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' });
    }
    
    if (isSameDay(date, yesterday)) {
        return getTranslation(lang, 'time.yesterday');
    }

    return date.toLocaleDateString(getLocale(lang));
}

export function formatMessageTimestamp(isoString: string, lang: Language = 'fi'): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const timePart = formatTime(isoString, lang);

    if (isSameDay(date, now)) {
        return timePart;
    }
    
    if (isSameDay(date, yesterday)) {
        return `${getTranslation(lang, 'time.yesterday')}, ${timePart}`;
    }

    return `${date.toLocaleDateString(getLocale(lang))}, ${timePart}`;
}
