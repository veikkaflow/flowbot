
import React, { useMemo, useState } from 'react';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { Submission } from '../types.ts';
import { Mail, Briefcase, Check, ExternalLink, X } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const LeadsView: React.FC = () => {
    const { conversations, updateSubmissionStatus } = useConversationContext();
    const { t } = useLanguage();
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

    // Flatten all submissions from all conversations into a single list
    const submissions: Submission[] = useMemo(() => {
        return conversations
            .flatMap(c => c.submissions || [])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [conversations]);

    const selectedSubmission = useMemo(() => 
        submissions.find(s => s.id === selectedSubmissionId) || null
    , [submissions, selectedSubmissionId]);

    const markAsHandled = async (submission: Submission, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        await updateSubmissionStatus(submission.conversationId, submission.id, !submission.isHandled);
    };

    return (
        <div className="h-full flex flex-col gap-6 relative">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                    <Briefcase className="w-6 h-6" /> {t('leads.title')}
                </h2>
                <p style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('leads.desc')}</p>
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
                                <th className="p-4 font-medium">{t('leads.date')}</th>
                                <th className="p-4 font-medium">{t('leads.type')}</th>
                                <th className="p-4 font-medium">{t('leads.name')}</th>
                                <th className="p-4 font-medium">{t('leads.email')}</th>
                                <th className="p-4 font-medium">{t('leads.details')}</th>
                                <th className="p-4 font-medium text-center">{t('leads.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                            {submissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>
                                        {t('leads.no_data')}
                                    </td>
                                </tr>
                            ) : (
                                submissions.map((sub) => (
                                    <tr 
                                        key={sub.id} 
                                        onClick={() => setSelectedSubmissionId(sub.id)}
                                        className="transition-colors cursor-pointer group border-b"
                                        style={{ borderColor: 'var(--admin-border, #374151)' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                            e.currentTarget.style.opacity = '0.5';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.opacity = '1';
                                        }}
                                    >
                                        <td className="p-4 whitespace-nowrap" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                            {new Date(sub.createdAt).toLocaleDateString()} <span className="text-xs" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{new Date(sub.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                sub.type === 'quote' ? 'bg-purple-900/50 text-purple-200' : 'bg-blue-900/50 text-blue-200'
                                            }`}>
                                                {sub.type === 'quote' ? <Briefcase className="w-3 h-3"/> : <Mail className="w-3 h-3"/>}
                                                {sub.type === 'quote' ? t('leads.type_quote') : t('leads.type_contact')}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{sub.data.name}</td>
                                        <td className="p-4" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{sub.data.email}</td>
                                        <td className="p-4 max-w-xs relative" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                            <div className="truncate" title={sub.data.message || sub.data.details}>
                                                {sub.data.message || sub.data.details}
                                            </div>
                                            {sub.data.company && <div className="text-xs mt-1" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{sub.data.company}</div>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={(e) => markAsHandled(sub, e)}
                                                className="p-2 rounded-full transition-colors"
                                                style={{
                                                    backgroundColor: sub.isHandled 
                                                        ? 'rgba(34, 197, 94, 0.3)' 
                                                        : 'var(--admin-sidebar-bg, #374151)',
                                                    color: sub.isHandled ? '#4ade80' : 'var(--admin-text-secondary, #d1d5db)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (sub.isHandled) {
                                                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.5)';
                                                    } else {
                                                        e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                                                        e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (sub.isHandled) {
                                                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                                                    } else {
                                                        e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                                        e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                                    }
                                                }}
                                                title={sub.isHandled ? t('leads.mark_unhandled') : t('leads.mark_handled')}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }} onClick={() => setSelectedSubmissionId(null)}>
                    <div className="rounded-lg shadow-2xl w-full max-w-2xl border overflow-hidden flex flex-col max-h-[90vh]" style={{
                        backgroundColor: 'var(--admin-card-bg, #1f2937)',
                        borderColor: 'var(--admin-border, #374151)'
                    }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b" style={{
                            borderColor: 'var(--admin-border, #374151)',
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)'
                        }}>
                            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                {selectedSubmission.type === 'quote' ? <Briefcase className="w-5 h-5"/> : <Mail className="w-5 h-5"/>}
                                {selectedSubmission.type === 'quote' ? t('leads.type_quote') : t('leads.type_contact')}
                            </h3>
                            <button 
                                onClick={() => setSelectedSubmissionId(null)} 
                                className="p-1.5 rounded-full transition-colors"
                                style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #1f2937)';
                                    e.currentTarget.style.color = 'var(--admin-text-primary, #f3f4f6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--admin-text-secondary, #d1d5db)';
                                }}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{t('leads.date')}</label>
                                    <p className="text-lg" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{t('leads.status')}</label>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedSubmission.isHandled ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                        {selectedSubmission.isHandled ? 'Käsitelty' : 'Odottaa toimenpiteitä'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{t('leads.name')}</label>
                                    <p className="text-lg font-medium" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{selectedSubmission.data.name}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{t('leads.email')}</label>
                                    <a href={`mailto:${selectedSubmission.data.email}`} className="text-blue-400 hover:underline text-lg">{selectedSubmission.data.email}</a>
                                </div>
                            </div>

                            {selectedSubmission.data.company && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>Yritys</label>
                                    <p className="text-lg" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{selectedSubmission.data.company}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>{t('leads.details')}</label>
                                <div className="p-4 rounded-lg border whitespace-pre-wrap leading-relaxed" style={{
                                    backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                                    borderColor: 'var(--admin-border, #374151)',
                                    color: 'var(--admin-text-primary, #f3f4f6)'
                                }}>
                                    {selectedSubmission.data.message || selectedSubmission.data.details || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-3" style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}>
                             <button 
                                onClick={() => markAsHandled(selectedSubmission)}
                                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors"
                                style={{
                                    backgroundColor: selectedSubmission.isHandled 
                                        ? 'var(--admin-sidebar-bg, #374151)' 
                                        : '#16a34a',
                                    color: selectedSubmission.isHandled 
                                        ? 'var(--admin-text-primary, #f3f4f6)' 
                                        : 'white'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedSubmission.isHandled) {
                                        e.currentTarget.style.backgroundColor = 'var(--admin-card-bg, #4b5563)';
                                    } else {
                                        e.currentTarget.style.backgroundColor = '#15803d';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedSubmission.isHandled) {
                                        e.currentTarget.style.backgroundColor = 'var(--admin-sidebar-bg, #374151)';
                                    } else {
                                        e.currentTarget.style.backgroundColor = '#16a34a';
                                    }
                                }}
                            >
                                <Check className="w-4 h-4" />
                                {selectedSubmission.isHandled ? t('leads.mark_unhandled') : t('leads.mark_handled')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsView;
