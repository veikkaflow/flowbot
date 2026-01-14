// Application constants

export const CONVERSATION_LIMITS = {
  MAX_MESSAGES: 50,
  MAX_RECENT_MESSAGES: 20,
  MAX_RESPONSE_CHARS: 10000,
} as const;

export const SIMULATION_PREFIXES = {
  VISITOR: 'sim_',
  CONVERSATION: 'sim_conv_',
} as const;

export const MESSAGE_SENDERS = {
  USER: 'user',
  BOT: 'bot',
  AGENT: 'agent',
  SYSTEM: 'system',
} as const;

export const MAX_CONVERSATION_TEXT_LENGTH = 30000;

export const MAX_TRAINING_TEXT_LENGTH = 15000;


