import { useBotContext } from '../context/BotContext.tsx';
import { AppSettings, Bot } from '../types.ts';

type SettingsKey = keyof AppSettings;

export const useSettings = <T extends SettingsKey>(settingsKey: T) => {
    const { activeBot, updateBot } = useBotContext();

    const settings = activeBot?.settings[settingsKey];

    const updateSettings = async (newSettings: Partial<AppSettings[T]>) => {
        if (!activeBot) return;
        
        try {
            // Correctly handle updates for both object and primitive settings
            const currentSetting = activeBot.settings[settingsKey];
            let finalSetting: AppSettings[T];
            
            if (typeof currentSetting === 'object' && currentSetting !== null && !Array.isArray(currentSetting)) {
                // For objects, merge the new settings with existing ones to preserve all fields
                finalSetting = { ...currentSetting, ...newSettings } as AppSettings[T];
            } else {
                // For primitives or arrays, use newSettings directly (but cast to full type)
                finalSetting = newSettings as AppSettings[T];
            }

            const updatedBot: Bot = {
                ...activeBot,
                settings: {
                    ...activeBot.settings,
                    [settingsKey]: finalSetting,
                },
            };
            await updateBot(updatedBot);
        } catch (error) {
            console.error(`Error updating ${settingsKey}:`, error);
            throw error;
        }
    };
    
    const setSettings = (newSettings: AppSettings[T]) => {
         if (activeBot) {
            const updatedBot: Bot = {
                ...activeBot,
                settings: {
                    ...activeBot.settings,
                    [settingsKey]: newSettings
                },
            };
            updateBot(updatedBot);
        }
    };

    return { settings, updateSettings, setSettings };
};