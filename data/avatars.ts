import { getAllStarterAvatars } from '../services/imageStorageService.ts';

// Cache for starter avatars to avoid multiple fetches
let cachedAvatars: {
    userAvatars: string[];
    botAvatars: string[];
    agentAvatars: string[];
} | null = null;

// Fallback avatars if Firebase Storage doesn't have any
const fallbackUserAvatars: string[] = [];
const fallbackBotAvatars: string[] = [];
const fallbackAgentAvatars: string[] = [];

/**
 * Gets starter avatars from Firebase Storage base folder
 * Falls back to empty arrays if not found
 */
export const getStarterAvatars = async (): Promise<{
    userAvatars: string[];
    botAvatars: string[];
    agentAvatars: string[];
}> => {
    // Return cached if available
    if (cachedAvatars) {
        return cachedAvatars;
    }
    
    try {
        const avatars = await getAllStarterAvatars();
        // Cache the result
        cachedAvatars = avatars;
        return avatars;
    } catch (error) {
        console.error('Error loading starter avatars, using fallback:', error);
        return {
            userAvatars: fallbackUserAvatars,
            botAvatars: fallbackBotAvatars,
            agentAvatars: fallbackAgentAvatars,
        };
    }
};

// Export empty arrays as default (will be populated when getStarterAvatars is called)
export const userAvatars: string[] = [];
export const botAvatars: string[] = [];
export const agentAvatars: string[] = [];
