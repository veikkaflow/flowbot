import { useArraySettings } from './useArraySettings.ts';
import { KnowledgeSource } from '../types.ts';

export const useTraining = () => {
    const { items: qnaData, addItem, updateItem, deleteItem } = useArraySettings<KnowledgeSource>(
        'qnaData',
        'training_'
    );

    return {
        qnaData,
        addTrainingData: addItem,
        updateTrainingData: updateItem,
        deleteTrainingData: deleteItem,
    };
};