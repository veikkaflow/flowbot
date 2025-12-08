
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
    <div className="h-full flex flex-col border-r" style={{
      backgroundColor: 'var(--admin-sidebar-bg, #1f2937)',
      borderColor: 'var(--admin-border, #374151)'
    }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--admin-border, #374151)' }}>
        <h2 className="text-xl font-bold" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('inbox.title')}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length > 0 ? (
          sortedConversations.map(conv => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            const isSelected = conv.id === activeConversationId;
            const agent = agents.find(a => a.id === conv.agentId);
            const isSimulation = conv.visitorId.startsWith('sim_');

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectConversation(conv.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`w-full text-left p-4 border-b transition-colors cursor-pointer ${conv.isEnded ? 'opacity-60' : ''}`}
                style={{
                  borderColor: 'var(--admin-border, #374151)',
                  backgroundColor: isSelected ? 'var(--admin-card-bg, #374151)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #374151)';
                    e.currentTarget.style.opacity = '0.5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = conv.isEnded ? '0.6' : '1';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <img src={defaultUserAvatar} alt="user" className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{conv.visitorName}</p>
                        {isSimulation && <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded-full">{t('inbox.simulation')}</span>}
                        {agent && <img src={agent.avatar} alt={agent.name} title={`${t('inbox.agent')}: ${agent.name}`} className="w-5 h-5 rounded-full" />}
                      </div>
                      <p className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
                        {lastMessage && formatConversationListTime(lastMessage.timestamp, language)}
                      </p>
                    </div>
                    <div className="flex justify-between items-start mt-1">
                      <p className="text-sm truncate pr-4" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
                        {lastMessage?.text || 'Ei viestejä'}
                      </p>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateConversationStatus(conv.id, conv.status === 'handled' ? 'pending' : 'handled');
                          }}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title={conv.status === 'handled' ? t('inbox.status_handled') || 'Handled' : t('inbox.status_pending') || 'Pending'}
                        >
                          {conv.status === 'handled' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--admin-text-muted, #9ca3af)' }} />
                          )}
                        </button>
                        {conv.isEnded && <Archive className="w-3.5 h-3.5" style={{ color: 'var(--admin-text-muted, #9ca3af)' }} />}
                        {!conv.isRead && !conv.isEnded && (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1" title={t('dash.unread')}></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="p-4 text-center" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{t('inbox.no_conversations')}</p>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
