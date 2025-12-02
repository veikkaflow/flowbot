
// components/ConversationList.tsx
import React from 'react';
import { Conversation } from '../types.ts';
import { formatConversationListTime } from '../utils/time.ts';
import { Archive, Check } from './Icons.tsx';
import { useBotContext } from '../context/BotContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useConversationContext } from '../context/ConversationContext.tsx';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, activeConversationId, onSelectConversation }) => {
  const { activeBot } = useBotContext();
  const { t, language } = useLanguage();
  const { updateConversationStatus } = useConversationContext();
  const agents = activeBot?.settings.agents || [];
  const defaultUserAvatar = activeBot?.settings.avatarSettings.selectedUserAvatar;

  const sortedConversations = [...conversations].sort((a, b) => {
    const lastMsgA = a.messages[a.messages.length - 1];
    const lastMsgB = b.messages[b.messages.length - 1];
    const timeA = lastMsgA ? new Date(lastMsgA.timestamp).getTime() : 0;
    const timeB = lastMsgB ? new Date(lastMsgB.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="h-full flex flex-col bg-gray-800 border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">{t('inbox.title')}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length > 0 ? (
          sortedConversations.map(conv => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            const isSelected = conv.id === activeConversationId;
            const agent = agents.find(a => a.id === conv.agentId);
            const isSimulation = conv.visitorId.startsWith('sim_');

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-4 border-b border-gray-700/50 transition-colors ${
                  isSelected ? 'bg-gray-700' : 'hover:bg-gray-700/50'
                } ${conv.isEnded ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <img src={defaultUserAvatar} alt="user" className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{conv.visitorName}</p>
                        {isSimulation && <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded-full">{t('inbox.simulation')}</span>}
                        {agent && <img src={agent.avatar} alt={agent.name} title={`${t('inbox.agent')}: ${agent.name}`} className="w-5 h-5 rounded-full" />}
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {lastMessage && formatConversationListTime(lastMessage.timestamp, language)}
                      </p>
                    </div>
                    <div className="flex justify-between items-start mt-1">
                      <p className="text-sm text-gray-400 truncate pr-4">
                        {lastMessage?.text || 'Ei viestejä'}
                      </p>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateConversationStatus(conv.id, conv.status === 'handled' ? 'pending' : 'handled');
                          }}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title={conv.status === 'handled' ? t('inbox.status_handled') || 'Handled' : t('inbox.status_pending') || 'Pending'}
                        >
                          {conv.status === 'handled' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-500" />
                          )}
                        </button>
                        {conv.isEnded && <Archive className="w-3.5 h-3.5 text-gray-500" />}
                        {!conv.isRead && !conv.isEnded && (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1" title={t('dash.unread')}></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <p className="p-4 text-center text-gray-500">{t('inbox.no_conversations')}</p>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
