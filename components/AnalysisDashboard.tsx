
import React from 'react';
import { useAnalysis } from '../hooks/useAnalysis.ts';
import { BarChart2, Loader, AlertTriangle, MessageSquare, Check, Zap } from './Icons.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

const AnalysisDashboard: React.FC = () => {
    const {
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        isLoading,
        error,
        analysisResult,
        runAnalysis,
    } = useAnalysis();
    const { t } = useLanguage();

    return (
        <div className="h-full flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><BarChart2 className="w-6 h-6" /> {t('anal.title')}</h2>
                <p style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>{t('anal.desc')}</p>
            </div>

            <div className="p-4 rounded-lg border flex flex-col md:flex-row items-center gap-4" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                <div className="flex-1 w-full md:w-auto">
                    <label htmlFor="startDate" className="block text-sm font-medium" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('anal.start_date')}</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-md border"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}
                    />
                </div>
                 <div className="flex-1 w-full md:w-auto">
                    <label htmlFor="endDate" className="block text-sm font-medium" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{t('anal.end_date')}</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-md border"
                        style={{
                            backgroundColor: 'var(--admin-sidebar-bg, #374151)',
                            color: 'var(--admin-text-primary, #f3f4f6)',
                            borderColor: 'var(--admin-border, #374151)'
                        }}
                    />
                </div>
                <div className="w-full md:w-auto self-end">
                    <button
                        onClick={runAnalysis}
                        disabled={isLoading}
                        className="w-full md:w-auto flex items-center justify-center gap-2 py-2.5 px-6 rounded-md bg-[var(--color-primary)] text-black font-semibold disabled:opacity-50"
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <BarChart2 className="w-5 h-5" />}
                        {isLoading ? t('anal.analyzing') : t('anal.analyze_btn')}
                    </button>
                </div>
            </div>

            <div className="flex-grow rounded-lg border flex flex-col p-6" style={{
                backgroundColor: 'var(--admin-card-bg, #1f2937)',
                borderColor: 'var(--admin-border, #374151)'
            }}>
                {isLoading && (
                    <div className="flex-grow flex flex-col items-center justify-center" style={{ color: 'var(--admin-text-secondary, #d1d5db)' }}>
                        <Loader className="w-12 h-12 animate-spin mb-4" />
                        <p className="font-semibold text-lg">{t('anal.loading_title')}</p>
                        <p className="text-sm">{t('anal.loading_desc')}</p>
                    </div>
                )}
                {error && (
                    <div className="flex-grow flex flex-col items-center justify-center text-red-300">
                        <AlertTriangle className="w-12 h-12 mb-4" />
                        <p className="font-semibold text-lg">{t('anal.error_title')}</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {!isLoading && !error && analysisResult && (
                    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><MessageSquare /> {t('anal.summary')}</h3>
                            <p className="whitespace-pre-wrap" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>{analysisResult.summary}</p>
                        </div>
                        <div className="pt-4 border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Check /> {t('anal.feedback')}</h3>
                            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                {analysisResult.keyFeedback.map((fb, i) => <li key={i}>{fb}</li>)}
                            </ul>
                        </div>
                         <div className="pt-4 border-t" style={{ borderColor: 'var(--admin-border, #374151)' }}>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}><Zap /> {t('anal.improvements')}</h3>
                            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--admin-text-primary, #f3f4f6)' }}>
                                {analysisResult.improvementSuggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
                 {!isLoading && !error && !analysisResult && (
                     <div className="flex-grow flex flex-col items-center justify-center" style={{ color: 'var(--admin-text-muted, #9ca3af)' }}>
                        <p>{t('anal.no_data')}</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AnalysisDashboard;
