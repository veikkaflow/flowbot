import { useArraySettings } from './useArraySettings.ts';
import { KnowledgeSource } from '../types.ts';

export const useKnowledgeBase = () => {
    const { items: knowledgeBase, addItem, updateItem, deleteItem } = useArraySettings<KnowledgeSource>(
        'knowledgeBase',
        'kb_'
    );

    return {
        knowledgeBase,
        addKnowledgeItem: addItem,
        updateKnowledgeItem: updateItem,
        deleteKnowledgeItem: deleteItem,
    };
};
