// utils/textParser.tsx
import React from 'react';

/**
 * Converts phone numbers and email addresses in text to Markdown links
 * @param text - The text to parse
 * @returns Text with Markdown links
 */
export function convertTextToMarkdownLinks(text: string): string {
    if (!text) return text;

    // Email regex pattern
    const emailRegex = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    
    // Phone number regex patterns (Finnish and international formats)
    const phoneRegex = /(\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4})/g;

    let result = text;

    // Replace emails with Markdown links
    result = result.replace(emailRegex, (match) => {
        return `[${match}](mailto:${match})`;
    });

    // Replace phone numbers with Markdown links (avoid replacing if part of email)
    result = result.replace(phoneRegex, (match, offset) => {
        // Check if this phone number is part of an email (already replaced)
        const beforeMatch = result.substring(0, offset);
        const afterMatch = result.substring(offset + match.length);
        const context = beforeMatch + match + afterMatch;
        
        // If email pattern exists in context, don't replace
        if (/([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(context)) {
            return match;
        }
        
        const cleanPhone = match.replace(/[\s-()]/g, '');
        return `[${match}](tel:${cleanPhone})`;
    });

    return result;
}

/**
 * Parses text and converts phone numbers and email addresses to clickable links
 * @param text - The text to parse
 * @returns React node with text and links
 */
export function parseTextWithLinks(text: string): React.ReactNode {
    if (!text) return text;

    // Email regex pattern
    const emailRegex = /([a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    
    // Phone number regex patterns (Finnish and international formats)
    // Matches: +358, 040, 050, 09-1234567, 09 123 4567, etc.
    const phoneRegex = /(\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4})/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // Find all matches (emails and phone numbers)
    const matches: Array<{ type: 'email' | 'phone'; match: string; index: number }> = [];

    // Find email matches
    let emailMatch;
    while ((emailMatch = emailRegex.exec(text)) !== null) {
        matches.push({
            type: 'email',
            match: emailMatch[0],
            index: emailMatch.index
        });
    }

    // Find phone matches
    let phoneMatch;
    while ((phoneMatch = phoneRegex.exec(text)) !== null) {
        // Check if this phone number is not part of an email
        const isPartOfEmail = matches.some(m => 
            m.type === 'email' && 
            phoneMatch.index >= m.index && 
            phoneMatch.index < m.index + m.match.length
        );
        
        if (!isPartOfEmail) {
            matches.push({
                type: 'phone',
                match: phoneMatch[0],
                index: phoneMatch.index
            });
        }
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Build React nodes
    matches.forEach(({ type, match, index }) => {
        // Add text before the match
        if (index > lastIndex) {
            parts.push(text.substring(lastIndex, index));
        }

        // Add the link
        if (type === 'email') {
            parts.push(
                <a
                    key={key++}
                    href={`mailto:${match}`}
                    className="text-[var(--color-primary)] hover:underline"
                >
                    {match}
                </a>
            );
        } else {
            // Clean phone number for tel: link (remove spaces, dashes, parentheses)
            const cleanPhone = match.replace(/[\s-()]/g, '');
            parts.push(
                <a
                    key={key++}
                    href={`tel:${cleanPhone}`}
                    className="text-[var(--color-primary)] hover:underline"
                >
                    {match}
                </a>
            );
        }

        lastIndex = index + match.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    // If no matches found, return original text
    if (parts.length === 0) {
        return text;
    }

    return <>{parts}</>;
}

