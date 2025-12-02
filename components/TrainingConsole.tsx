
import React, { useState } from 'react';
import { useTraining } from '../hooks/useTraining.ts';
import { useNotification } from '../context/NotificationContext.tsx';
import { generateTrainingDataFromText } from '../services/geminiService.ts';
import { KnowledgeSource } from '../types.ts';
import { Plus, Trash2, Loader } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const TrainingConsole: React.FC = () => {
    const { qnaData, addTrainingData, updateTrainingData, deleteTrainingData } = useTraining();
    const { addNotification } = useNotification();
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationText, setGenerationText] = useState('');
    const { t } = useLanguage();

    const handleGenerate = async () => {
        if (!generationText.trim()) return;
        setIsGenerating(true);
        try {
            const newItems = await generateTrainingDataFromText(generationText, 'Manually provided text');
            if (newItems.length > 0) {
                newItems.forEach(item => addTrainingData(item));
                addNotification({ message: `${newItems.length} uutta Q&A-paria luotu.`, type: 'success' });
                setGenerationText('');
            } else {
                addNotification({ message: 'Ei voitu luoda Q&A-pareja tekstistä.', type: 'warning' });
            }
        } catch (error) {
            addNotification({ message: 'Virhe luodessa Q&A-pareja.', type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUpdate = (item: KnowledgeSource, field: 'name' | 'content', value: string) => {
        updateTrainingData({ ...item, [field]: value });
    };

    if (!qnaData) return null;

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-white">{t('know.generate_title')}</h4>
                <p className="text-sm text-gray-400 mt-1">{t('know.generate_desc')}</p>
                 <div className="mt-3 space-y-2">
                    <textarea
                        rows={5}
                        value={generationText}
                        onChange={(e) => setGenerationText(e.target.value)}
                        placeholder={t('know.text_placeholder')}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md"
                        disabled={isGenerating}
                    />
                    <button onClick={handleGenerate} disabled={isGenerating || !generationText.trim()} className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-[var(--color-primary)] text-black font-semibold rounded-md disabled:opacity-50">
                        {isGenerating ? <Loader className="w-5 h-5 animate-spin" /> : null}
                        {isGenerating ? 'Luodaan...' : t('know.generate_btn')}
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-white">{t('know.manual_qna')}</h4>
                    <button onClick={() => addTrainingData({ type: 'qna', name: 'Uusi kysymys', content: 'Vastaus tähän.' })} className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md"><Plus className="w-4 h-4"/> {t('know.add_pair')}</button>
                </div>
                 <div className="mt-4 space-y-3">
                    {qnaData.map(item => (
                        <div key={item.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 space-y-2">
                            <div>
                                <label className="text-xs text-gray-400">{t('know.question')}</label>
                                <input type="text" value={item.name} onChange={e => handleUpdate(item, 'name', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">{t('know.answer')}</label>
                                <textarea rows={2} value={item.content} onChange={e => handleUpdate(item, 'content', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm" />
                            </div>
                            <div className="text-right">
                                <button onClick={() => deleteTrainingData(item.id)} className="p-1 text-gray-500 hover:text-red-400 rounded-full"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrainingConsole;
