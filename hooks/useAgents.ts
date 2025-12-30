import { useArraySettings } from './useArraySettings.ts';
import { Agent } from '../types.ts';
import { useBotContext } from '../context/BotContext.tsx';

export const useAgents = () => {
    const { items: agents, addItem: baseAddItem, updateItem, deleteItem } = useArraySettings<Agent>(
        'agents',
        'agent_'
    );
    const { activeBot } = useBotContext();

    const addAgent = () => {
        if (agents) {
            // Käytä aktiivisen botin agent-avatareja
            const agentAvatars = activeBot?.settings.avatarSettings?.agentAvatarGallery || [];
            const avatarIndex = agentAvatars.length > 0 
                ? agents.length % agentAvatars.length 
                : 0;
            const avatar = agentAvatars[avatarIndex] || '';
            
            baseAddItem({
                name: 'Uusi Agentti',
                avatar: avatar,
            });
        }
    };

    return {
        agents,
        addAgent,
        updateAgent: updateItem,
        deleteAgent: deleteItem,
    };
};
