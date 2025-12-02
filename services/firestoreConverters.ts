
// services/firestoreConverters.ts

import {
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
    WithFieldValue,
    Timestamp
} from 'firebase/firestore';
import { Bot, Conversation, Message, AppSettings, Submission, LocalizedString } from '../types.ts';
import { botTemplates } from '../data/defaultBots.ts';

// Helper to migrate legacy string fields to LocalizedString objects
const migrateToLocalized = (value: any): LocalizedString => {
    if (typeof value === 'string') {
        return { fi: value, en: '' };
    }
    if (value && typeof value === 'object' && 'fi' in value) {
        return value as LocalizedString;
    }
    return { fi: '', en: '' };
};

// Helper to migrate array of QuickReplies
const migrateQuickReplies = (replies: any[]) => {
    if (!Array.isArray(replies)) return [];
    return replies.map(r => ({
        ...r,
        text: migrateToLocalized(r.text)
    }));
};

// A simple deep merge utility to hydrate settings
const deepMerge = (target: any, source: any) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};
const isObject = (item: any) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};


/**
 * Custom Firestore converter for the Bot type.
 */
export const botConverter: FirestoreDataConverter<Bot> = {
    toFirestore(bot: WithFieldValue<Bot>): DocumentData {
        const { id, ...data } = bot;
        return data;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Bot {
        const data = snapshot.data(options);
        const defaultSettings = botTemplates[0].settings;
        
        // Hydrate and Migrate Settings
        const hydratedSettings = deepMerge(defaultSettings, data.settings);
        
        // Explicit Migration for Localized Fields
        if (hydratedSettings.personality) {
            hydratedSettings.personality.openingMessage = migrateToLocalized(hydratedSettings.personality.openingMessage);
            hydratedSettings.personality.quickReplies = migrateQuickReplies(hydratedSettings.personality.quickReplies);
        }

        return {
            id: snapshot.id,
            name: data.name,
            ownerId: data.ownerId,
            settings: hydratedSettings as AppSettings,
        };
    }
};


/**
 * Custom Firestore converter for the Conversation type.
 */
export const conversationConverter: FirestoreDataConverter<Conversation> = {
    toFirestore(conversation: WithFieldValue<Conversation>): DocumentData {
        const { id, ...data } = conversation;
        return data;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Conversation {
        const data = snapshot.data(options);
        const messages: Message[] = (data.messages || []).map((msg: any) => ({
            ...msg,
            // Ensure timestamp is always a string
            timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate().toISOString() : msg.timestamp
        }));

        return {
            id: snapshot.id,
            botId: data.botId,
            visitorId: data.visitorId,
            visitorName: data.visitorName,
            messages: messages,
            isRead: data.isRead,
            isEnded: data.isEnded,
            agentId: data.agentId,
            submissions: data.submissions || [],
            status: data.status || 'pending',
        };
    }
};

/**
 * Custom Firestore converter for the Submission type.
 */
export const submissionConverter: FirestoreDataConverter<Submission> = {
    toFirestore(submission: WithFieldValue<Submission>): DocumentData {
        const { id, ...data } = submission;
        return data;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Submission {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            botId: data.botId,
            conversationId: data.conversationId,
            visitorId: data.visitorId,
            visitorName: data.visitorName,
            type: data.type,
            data: data.data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            isHandled: data.isHandled || false,
        };
    }
};

/**
 * Sanitizes an object to ensure it's safe to be stored in React state.
 */
export function sanitizeForState<T>(obj: any): T {
    if (obj instanceof Timestamp) {
        return obj.toDate().toISOString() as any;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForState(item)) as any;
    }
    if (obj !== null && typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = sanitizeForState(obj[key]);
            }
        }
        return newObj as T;
    }
    return obj;
}
