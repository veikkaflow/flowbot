import { useConversationContext } from "@/context/ConversationContext";
import { useLanguage } from "@/context/LanguageContext";
import { Conversation } from "@/types";
import { useMemo, useState } from "react";
import { Briefcase } from "./Icons";

const Summariesview: React.FC = () => {

    const { conversations } = useConversationContext();
    //const { conversations: allConversations } = useConversationContext();
    const { t } = useLanguage();

    // Flatten all submissions from all conversations into a single list
    const conversationList: Conversation[] = useMemo(() => {

        return conversations.filter(c => c.summary && c.summary.trim() !== '');

    }, [conversations]);

    return (
        <div className="h-full flex flex-col gap-6 relative">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                    <Briefcase className="w-6 h-6" /> {t('summaries.title')}
                </h2>
                <p style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('summaries.desc')}</p>
            </div>

            <div className="rounded-lg border overflow-hidden flex-1" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <div className="overflow-x-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 shadow-sm z-10" style={{ backgroundColor: 'var(--admin-sidebar-bg, #374151)' }}>
                            <tr className="text-sm border-b" style={{
                                color: 'var(--admin-text-secondary, #d1d5db)',
                                borderColor: 'var(--admin-border, #374151)'
                            }}>
                                <th className="p-4 font-medium">{t('summaries.visitor')}</th>
                                <th className="p-4 font-medium">{t('summaries.content')}</th>
                                <th className="p-4 font-medium">{t('summaries.date')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            { conversationList.length > 0 ? conversationList.map((conversation) => (
                                <tr key={conversation.id} className="border-b" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                                    <td className="p-4" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                        {conversation.visitorName}
                                    </td>
                                    <td className="p-4" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                        {conversation.summary}
                                    </td>
                                    <td className="p-4" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
                                        {conversation.messages[0]?.timestamp 
                                            ? new Date(conversation.messages[0].timestamp).toLocaleDateString('fi-FI')
                                            : '-'
                                        }
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
                                        {t('summaries.no_data')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Summariesview;