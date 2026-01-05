// Types for Firebase Functions - shared with client

export type Sender = 'user' | 'bot' | 'agent' | 'system';

export interface Message {
    id: string;
    text: string;
    sender: Sender;
    timestamp: string;
    isStreaming?: boolean;
}

export interface Conversation {
    id: string;
    botId: string;
    visitorId: string;
    visitorName: string;
    messages: Message[];
    isRead: boolean;
    isEnded: boolean;
    agentId: string | null;
    submissions?: any[];
    summary?: string;
    status?: 'pending' | 'handled';
}

export interface KnowledgeSource {
    id: string;
    type: 'file' | 'url' | 'qna';
    name: string;
    content: string;
    fileUrl?: string;
    additionalData?: Record<string, any>;
}

export interface LocalizedString {
    fi: string;
    en: string;
}

export interface Scenario {
    id: string;
    scenario: string;
    userMessage: string;
    botResponse: string;
}

export interface QuickReply {
    id: string;
    text: LocalizedString;
    icon: string;
}

export interface PersonalitySettings {
    tone: 'Ystävällinen' | 'Ammattimainen' | 'Rento' | 'Asiantunteva';
    openingMessage: LocalizedString;
    customInstruction: string;
    scenarios: Scenario[];
    quickReplies: QuickReply[];
}

export interface BehaviorSettings {
    askForName: boolean;
    askForContactInfo: 'never' | 'optional' | 'required';
    leadGenHook: string; // Rule that defines when AI should use submitQuoteRequest tool
    contactRule?: string; // Rule that defines when AI should use submitContactForm tool
    operatingMode: 'bot_only' | 'bot_then_agent' | 'agents_only';
    allowNameChange: boolean;
    showContactButton: boolean;
    showQuoteButton: boolean;
    language: 'fi' | 'en';
    helpText?: string;
}

export interface AppearanceSettings {
    brandName: string;
    brandLogo?: string;
    logoGallery: string[];
    websiteUrl?: string;
    primaryColor: string;
    headerColor: string;
    backgroundAnimation: string;
    themeMode: 'light' | 'dark';
}

export interface AppSettings {
    appearance: AppearanceSettings;
    personality: PersonalitySettings;
    behavior: BehaviorSettings;
    schedule: any;
    avatarSettings: any;
    agents: any[];
    agentsEnabled: boolean;
    knowledgeBase: KnowledgeSource[];
    qnaData: KnowledgeSource[];
    userManagement: any;
}

export interface AnalysisResult {
    summary: string;
    keyFeedback: string[];
    improvementSuggestions: string[];
}

