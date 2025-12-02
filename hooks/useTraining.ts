import { useSettings } from './useSettings.ts';
// FIX: Replaced non-existent TrainingData with KnowledgeSource.
import { KnowledgeSource } from '../types.ts';

export const useTraining = () => {
    // FIX: Changed settings key from 'trainingData' to 'qnaData' to match AppSettings.
    const { settings: qnaData, setSettings } = useSettings('qnaData');

    const addTrainingData = (item: Omit<KnowledgeSource, 'id'>) => {
        if (qnaData) {
            const newItem: KnowledgeSource = {
                ...item,
                id: `training_${Date.now()}`,
            };
            setSettings([...qnaData, newItem]);
        }
    };
    
    const updateTrainingData = (updatedItem: KnowledgeSource) => {
        if (qnaData) {
            const updatedData = qnaData.map(item => item.id === updatedItem.id ? updatedItem : item);
            setSettings(updatedData);
        }
    };

    const deleteTrainingData = (id: string) => {
        if (qnaData) {
            const updatedData = qnaData.filter(item => item.id !== id);
            setSettings(updatedData);
        }
    };

    return {
        qnaData,
        addTrainingData,
        updateTrainingData,
        deleteTrainingData
    };
};