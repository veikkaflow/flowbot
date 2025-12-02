import { useState, useCallback } from 'react';
import { useConversationContext } from '../context/ConversationContext.tsx';
import { AnalysisResult } from '../types.ts';
import { analyzeConversations } from '../services/geminiService.ts';

const getISODateString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export const useAnalysis = () => {
    const { conversations } = useConversationContext();
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return getISODateString(d);
    });
    const [endDate, setEndDate] = useState<string>(getISODateString(new Date()));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    const runAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day

            const relevantConversations = conversations.filter(c => {
                if (c.messages.length === 0) return false;
                const conversationDate = new Date(c.messages[0].timestamp);
                return conversationDate >= start && conversationDate <= end;
            });

            if (relevantConversations.length === 0) {
                setError("Valitulla ajanjaksolla ei löytynyt analysoitavia keskusteluja.");
                setIsLoading(false);
                return;
            }

            const result = await analyzeConversations(relevantConversations);
            setAnalysisResult(result);

        } catch (e: any) {
            console.error("Analysis failed:", e);
            setError(e.message || "Analysointi epäonnistui tuntemattomasta syystä.");
        } finally {
            setIsLoading(false);
        }

    }, [startDate, endDate, conversations]);

    return {
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        isLoading,
        error,
        analysisResult,
        runAnalysis,
    };
};
