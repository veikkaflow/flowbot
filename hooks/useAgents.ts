// FIX: This file was created to resolve "Cannot find name" and module resolution errors.
import { useSettings } from './useSettings.ts';
import { Agent } from '../types.ts';
import { useBotContext } from '../context/BotContext.tsx';

export const useAgents = () => {
    const { settings: agents, setSettings } = useSettings('agents');
    const { activeBot } = useBotContext();

    const addAgent = () => {
        if (agents) {
            // Käytä aktiivisen botin agent-avatareja
            const agentAvatars = activeBot?.settings.avatarSettings?.agentAvatarGallery || [];
            const avatarIndex = agentAvatars.length > 0 
                ? agents.length % agentAvatars.length 
                : 0;
            const avatar = agentAvatars[avatarIndex] || '';
            
            const newAgent: Agent = {
                id: `agent_${Date.now()}`,
                name: 'Uusi Agentti',
                avatar: avatar,
            };
            setSettings([...agents, newAgent]);
        }
    };

    const updateAgent = (updatedAgent: Agent) => {
        if (agents) {
            const updatedAgents = agents.map(agent =>
                agent.id === updatedAgent.id ? updatedAgent : agent
            );
            setSettings(updatedAgents);
        }
    };

    const deleteAgent = (id: string) => {
        if (agents) {
            const updatedAgents = agents.filter(agent => agent.id !== id);
            setSettings(updatedAgents);
        }
    };

    return {
        agents,
        addAgent,
        updateAgent,
        deleteAgent,
    };
};
