
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
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-6 h-6" /> {t('leads.title')}
                </h2>
                <p className="text-gray-400">{t('leads.desc')}</p>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-1">
                <div className="overflow-x-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-900 shadow-sm z-10">
                            <tr className="text-gray-400 text-sm border-b border-gray-700">
                                <th className="p-4 font-medium">{t('leads.date')}</th>
                                <th className="p-4 font-medium">{t('leads.type')}</th>
                                <th className="p-4 font-medium">{t('leads.name')}</th>
                                <th className="p-4 font-medium">{t('leads.email')}</th>
                                <th className="p-4 font-medium">{t('leads.details')}</th>
                                <th className="p-4 font-medium text-center">{t('leads.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-700">
                            {submissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        {t('leads.no_data')}
                                    </td>
                                </tr>
                            ) : (
                                submissions.map((sub) => (
                                    <tr 
                                        key={sub.id} 
                                        onClick={() => setSelectedSubmissionId(sub.id)}
                                        className="hover:bg-gray-700/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4 text-gray-300 whitespace-nowrap">
                                            {new Date(sub.createdAt).toLocaleDateString()} <span className="text-xs text-gray-500">{new Date(sub.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                sub.type === 'quote' ? 'bg-purple-900/50 text-purple-200' : 'bg-blue-900/50 text-blue-200'
                                            }`}>
                                                {sub.type === 'quote' ? <Briefcase className="w-3 h-3"/> : <Mail className="w-3 h-3"/>}
                                                {sub.type === 'quote' ? t('leads.type_quote') : t('leads.type_contact')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white font-medium">{sub.data.name}</td>
                                        <td className="p-4 text-gray-300">{sub.data.email}</td>
                                        <td className="p-4 text-gray-300 max-w-xs relative">
                                            <div className="truncate" title={sub.data.message || sub.data.details}>
                                                {sub.data.message || sub.data.details}
                                            </div>
                                            {sub.data.company && <div className="text-xs text-gray-500 mt-1">{sub.data.company}</div>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={(e) => markAsHandled(sub, e)}
                                                className={`p-2 rounded-full transition-colors ${
                                                    sub.isHandled 
                                                    ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' 
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                                                }`}
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
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setSelectedSubmissionId(null)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                {selectedSubmission.type === 'quote' ? <Briefcase className="w-5 h-5"/> : <Mail className="w-5 h-5"/>}
                                {selectedSubmission.type === 'quote' ? t('leads.type_quote') : t('leads.type_contact')}
                            </h3>
                            <button onClick={() => setSelectedSubmissionId(null)} className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('leads.date')}</label>
                                    <p className="text-white text-lg">{new Date(selectedSubmission.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('leads.status')}</label>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedSubmission.isHandled ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                                    }`}>
                                        {selectedSubmission.isHandled ? 'Käsitelty' : 'Odottaa toimenpiteitä'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('leads.name')}</label>
                                    <p className="text-white text-lg font-medium">{selectedSubmission.data.name}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('leads.email')}</label>
                                    <a href={`mailto:${selectedSubmission.data.email}`} className="text-blue-400 hover:underline text-lg">{selectedSubmission.data.email}</a>
                                </div>
                            </div>

                            {selectedSubmission.data.company && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Yritys</label>
                                    <p className="text-white text-lg">{selectedSubmission.data.company}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-700">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('leads.details')}</label>
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {selectedSubmission.data.message || selectedSubmission.data.details || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
                             <button 
                                onClick={() => markAsHandled(selectedSubmission)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                                    selectedSubmission.isHandled 
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
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
