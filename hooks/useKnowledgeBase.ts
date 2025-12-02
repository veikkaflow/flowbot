// FIX: This file was created to resolve "Cannot find name" and module resolution errors.
import { useSettings } from './useSettings.ts';
import { KnowledgeSource } from '../types.ts';

export const useKnowledgeBase = () => {
    const { settings: knowledgeBase, setSettings } = useSettings('knowledgeBase');

    const addKnowledgeItem = (item: Omit<KnowledgeSource, 'id'>) => {
        if (knowledgeBase) {
            const newItem: KnowledgeSource = {
                ...item,
                id: `kb_${Date.now()}`,
            };
            setSettings([...knowledgeBase, newItem]);
        }
    };

    const updateKnowledgeItem = (updatedItem: KnowledgeSource) => {
        if (knowledgeBase) {
            const updatedData = knowledgeBase.map(item => (item.id === updatedItem.id ? updatedItem : item));
            setSettings(updatedData);
        }
    };

    const deleteKnowledgeItem = (id: string) => {
        if (knowledgeBase) {
            const updatedData = knowledgeBase.filter(item => item.id !== id);
            setSettings(updatedData);
        }
    };

    return {
        knowledgeBase,
        addKnowledgeItem,
        updateKnowledgeItem,
        deleteKnowledgeItem,
    };
};
