import { useSettings } from './useSettings.ts';
import { AppSettings } from '../types.ts';

type SettingsKey = keyof AppSettings;

/**
 * Generic hook for managing array-based settings with CRUD operations
 * @param settingsKey - The key in AppSettings that contains the array
 * @param idPrefix - Prefix for generating unique IDs (e.g., 'kb_', 'training_', 'agent_')
 */
export const useArraySettings = <T extends { id: string }>(
    settingsKey: SettingsKey,
    idPrefix: string
) => {
    const { settings: items, setSettings } = useSettings<typeof settingsKey>(settingsKey);

    const addItem = (item: Omit<T, 'id'>) => {
        if (items) {
            const newItem = {
                ...item,
                id: `${idPrefix}${Date.now()}`,
            } as T;
            setSettings([...items, newItem] as AppSettings[typeof settingsKey]);
        }
    };

    const updateItem = (updatedItem: T) => {
        if (items) {
            const updatedData = items.map((item: T) =>
                item.id === updatedItem.id ? updatedItem : item
            );
            setSettings(updatedData as AppSettings[typeof settingsKey]);
        }
    };

    const deleteItem = (id: string) => {
        if (items) {
            const updatedData = items.filter((item: T) => item.id !== id);
            setSettings(updatedData as AppSettings[typeof settingsKey]);
        }
    };

    return {
        items: items as T[] | undefined,
        addItem,
        updateItem,
        deleteItem,
    };
};

