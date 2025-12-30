import { Conversation } from '../types.ts';
import { generateId } from '../utils/id.ts';

// Sample data (can be used for initialization if needed)
export const createSampleConversations = (): Conversation[] => {
    const sampleBots = ['bot_atFlow_fi', 'bot_Lamnia_com', 'bot_Aaltovoima_fi', 'bot_Oilpoint_fi'];
    const conversations: Conversation[] = [];

    sampleBots.forEach(botId => {
        const visitor1 = `visitor_${botId.slice(4, 8)}_1`;
        const visitor2 = `visitor_${botId.slice(4, 8)}_2`;
        conversations.push(
            {
                id: `conv_1_${botId}`,
                botId: botId,
                visitorId: visitor1,
                visitorName: 'Matti Meikäläinen',
                messages: [
                    { id: generateId(), sender: 'user', text: 'Hei, tarvitsisin apua tilaukseni kanssa.', timestamp: new Date(Date.now() - 3600000).toISOString() },
                    { id: generateId(), sender: 'bot', text: 'Terve! Kerron mielelläni lisää. Mikä on tilausnumerosi?', timestamp: new Date(Date.now() - 3540000).toISOString() },
                ],
                isRead: true,
                isEnded: false,
                agentId: null,
            },
            {
                id: `conv_2_${botId}`,
                botId: botId,
                visitorId: visitor2,
                visitorName: 'Vierailija 345',
                messages: [
                    { id: generateId(), sender: 'user', text: 'Onko teillä palautusoikeutta?', timestamp: new Date(Date.now() - 180000).toISOString() },
                ],
                isRead: false,
                isEnded: false,
                agentId: null,
            }
        );
    });

    return conversations;
};