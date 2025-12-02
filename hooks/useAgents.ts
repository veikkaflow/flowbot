// FIX: This file was created to resolve "Cannot find name" and module resolution errors.
import { useSettings } from './useSettings.ts';
import { Agent } from '../types.ts';
import { agentAvatars } from '../data/avatars.ts';

export const useAgents = () => {
    const { settings: agents, setSettings } = useSettings('agents');

    const addAgent = () => {
        if (agents) {
            const newAgent: Agent = {
                id: `agent_${Date.now()}`,
                name: 'Uusi Agentti',
                avatar: agentAvatars[agents.length % agentAvatars.length], // Cycle through default avatars
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
