
// hooks/usePersonality.ts
import { useSettings } from './useSettings.ts';
import { Scenario, QuickReply, IconName } from '../types.ts';

export const usePersonality = () => {
    const { settings: personality, updateSettings, setSettings } = useSettings('personality');

    const addScenario = () => {
        if(personality) {
            const newScenario: Scenario = {
                id: `scenario_${Date.now()}`,
                scenario: '',
                userMessage: '',
                botResponse: '',
            };
            setSettings({ ...personality, scenarios: [...personality.scenarios, newScenario] });
        }
    };

    const updateScenario = (updatedScenario: Scenario) => {
        if(personality) {
            const updatedScenarios = personality.scenarios.map(s => s.id === updatedScenario.id ? updatedScenario : s);
            setSettings({ ...personality, scenarios: updatedScenarios });
        }
    };
    
    const deleteScenario = (id: string) => {
        if(personality) {
            const updatedScenarios = personality.scenarios.filter(s => s.id !== id);
            setSettings({ ...personality, scenarios: updatedScenarios });
        }
    };

    const addQuickReply = () => {
        if (personality) {
            const newReply: QuickReply = {
                id: `qr_${Date.now()}`,
                text: { fi: 'Uusi kysymys', en: 'New Question' }, // Initialized with both languages
                icon: 'HelpCircle',
            };
            const newReplies = [...(personality.quickReplies || []), newReply];
            setSettings({ ...personality, quickReplies: newReplies });
        }
    };

    const updateQuickReply = (updatedReply: QuickReply) => {
        if (personality && personality.quickReplies) {
            const updatedReplies = personality.quickReplies.map(qr => qr.id === updatedReply.id ? updatedReply : qr);
            setSettings({ ...personality, quickReplies: updatedReplies });
        }
    };

    const deleteQuickReply = (id: string) => {
        if (personality && personality.quickReplies) {
            const updatedReplies = personality.quickReplies.filter(qr => qr.id !== id);
            setSettings({ ...personality, quickReplies: updatedReplies });
        }
    };

    return { 
        personality, 
        updateSettings, 
        addScenario, 
        updateScenario, 
        deleteScenario, 
        addQuickReply,
        updateQuickReply,
        deleteQuickReply,
    };
};
