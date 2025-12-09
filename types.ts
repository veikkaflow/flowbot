
// types.ts

export type IconName = 
  | 'Smile' | 'Plus' | 'Trash2' | 'HelpCircle' | 'MessageSquare' | 'Settings' 
  | 'Shield' | 'Book' | 'Clock' | 'Users' | 'Palette' | 'LayoutColumns' 
  | 'Monitor' | 'ChevronsUpDown' | 'LogOut' | 'Check' | 'Home' | 'Mail' 
  | 'BarChart2' | 'User' | 'Bot' | 'UserCheck' | 'Send' | 'UserX' 
  | 'Calendar' | 'X' | 'PlusSquare' | 'Loader' | 'RefreshCcw' | 'ArrowLeft' 
  | 'ArrowDown' | 'UploadCloud' | 'FileText' | 'Edit2' | 'AlertTriangle' 
  | 'Info' | 'Archive' | 'Zap' | 'Lock' | 'Briefcase' | 'Image' | 'BrandLogo'
  | 'List'; // Added List icon

// General
export type Sender = 'user' | 'bot' | 'agent' | 'system';

export interface LocalizedString {
    fi: string;
    en: string;
}

// Messages and Conversations
export interface Message {
    id: string;
    text: string;
    sender: Sender;
    timestamp: string;
    isStreaming?: boolean;
}

export interface Submission {
    id: string;
    botId?: string;       // Added for global querying
    conversationId: string;
    visitorId?: string;   // Added context
    visitorName?: string; // Added context
    type: 'contact' | 'quote';
    data: Record<string, string>;
    createdAt: string;
    isHandled?: boolean;  // Added status tracking
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
    submissions?: Submission[];
    status?: 'pending' | 'handled';
}

// Bot & Settings
export interface Bot {
    id: string;
    name: string;
    ownerId: string;
    settings: AppSettings;
    templateId?: string; // Optional field to identify the base template
}

export interface AppSettings {
    appearance: AppearanceSettings;
    personality: PersonalitySettings;
    behavior: BehaviorSettings;
    schedule: ScheduleSettings;
    avatarSettings: AvatarSettings;
    agents: Agent[];
    agentsEnabled: boolean;
    knowledgeBase: KnowledgeSource[];
    qnaData: KnowledgeSource[]; // Specific Q&A pairs
    userManagement: UserManagementSettings;
}

export type BackgroundAnimation = 'none' | 'aurora' | 'waves' | 'geometric' | 'gradient' | 'clearwaves' | 'particles' | 'pulse' | 'mesh';

export interface AppearanceSettings {
    brandName: string;
    brandLogo?: string;
    logoGallery: string[];
    websiteUrl?: string;
    primaryColor: string;
    headerColor: string;
    backgroundAnimation: BackgroundAnimation;
    themeMode: 'light' | 'dark';
}

export interface Scenario {
    id: string;
    scenario: string;
    userMessage: string;
    botResponse: string;
}

export interface QuickReply {
    id: string;
    text: LocalizedString; // Changed to localized
    icon: IconName;
}

export interface PersonalitySettings {
    tone: 'Ystävällinen' | 'Ammattimainen' | 'Rento' | 'Asiantunteva';
    openingMessage: LocalizedString; // Changed to localized
    customInstruction: string;
    scenarios: Scenario[];
    quickReplies: QuickReply[];
}

export interface BehaviorSettings {
    askForName: boolean;
    askForContactInfo: 'never' | 'optional' | 'required';
    leadGenHook: string;
    operatingMode: 'bot_only' | 'bot_then_agent' | 'agents_only';
    allowNameChange: boolean;
    showContactButton: boolean;
    showQuoteButton: boolean;
    language: 'fi' | 'en'; // Added Bot Language Setting
    helpText?: string; // Custom help text that users can write
}

export interface DailySchedule {
    isEnabled: boolean;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
}

export interface ScheduleSettings {
    isAlwaysOnline: boolean;
    dailySchedules: { [dayIndex: number]: DailySchedule }; // 0: Sun, 1: Mon, ...
    offlineMessage: string;
}

export interface AvatarSettings {
    userAvatarGallery: string[];
    botAvatarGallery: string[];
    agentAvatarGallery: string[];
    selectedUserAvatar: string;
    selectedBotAvatar: string;
    selectedAgentAvatar: string;
}

export interface Agent {
    id: string;
    name: string;
    avatar: string;
}

export interface KnowledgeSource {
    id: string;
    type: 'file' | 'url' | 'qna';
    name: string;
    content: string;
    fileUrl?: string; // URL to the original file in storage (for PDFs)
}

// User Management
export interface User {
    uid: string;
    email: string;
    role: 'superadmin' | 'admin' | 'agent' | 'viewer';
    name: string;
    allowedBotIds?: string[]; // Bot IDs that this user can access (admin can manage)
}

export interface UserManagementSettings {
    users: User[];
}

// UI State
export type AdminView = 'dashboard' | 'inbox' | 'leads' | 'settings' | 'analysis'; // Added 'leads'
export type SettingsView = 'appearance' | 'personality' | 'behavior' | 'schedule' | 'avatars' | 'knowledge' | 'agents' | 'users' | 'installation';
export type LayoutView = 'split' | 'customer' | 'admin';

// API & Services
export interface ScrapedData {
    title: string;
    text: string;
    logos: string[];
    colors: string[];
}

export interface AnalysisResult {
    summary: string;
    keyFeedback: string[];
    improvementSuggestions: string[];
}

// Notifications
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export interface NotificationAction {
    label: string;
    onClick: () => void;
}
export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
    timestamp?: string;
    action?: NotificationAction;
}
