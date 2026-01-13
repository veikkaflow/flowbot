
// services/geminiService.ts

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.ts';
import { AppSettings, Conversation, KnowledgeSource, AnalysisResult, Message, RichContent } from '../types.ts';

// Firebase Functions callables
const geminiChatStreamCallable = httpsCallable<{
  conversation: Conversation;
  settings: AppSettings;
}, { text: string; richContent?: RichContent[] }>(functions, 'geminiChatStream');

const geminiConversationSummaryCallable = httpsCallable<{
  conversation: Conversation;
}, { summary: string }>(functions, 'geminiConversationSummary');

const geminiGenerateTrainingDataCallable = httpsCallable<{
  text: string;
  title: string;
}, { data: Omit<KnowledgeSource, 'id'>[] }>(functions, 'geminiGenerateTrainingData');

const geminiAnalyzeConversationsCallable = httpsCallable<{
  conversations: Conversation[];
}, AnalysisResult>(functions, 'geminiAnalyzeConversations');

const geminiTranslateTextCallable = httpsCallable<{
  text: string;
  targetLanguage: 'fi' | 'en';
}, { translatedText: string }>(functions, 'geminiTranslateText');

export async function* getChatResponseStream(
    conversation: Conversation,
    settings: AppSettings
): AsyncGenerator<string | { text: string; richContent?: RichContent[] }> {
    try {
        // Kutsu Firebase Functions -endpointtia
        const result = await geminiChatStreamCallable({
            conversation,
            settings
        });

        // Simuloi streaming-efektiä jakamalla vastaus sanoihin
        // HUOM: Tämä on yksinkertaistettu versio. Oikea streaming vaatii HTTP-endpointin
        const text = result.data.text;
        const richContent = result.data.richContent;
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            yield words[i] + (i < words.length - 1 ? ' ' : '');
            // Pieni viive streaming-efektin vuoksi
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        // Yield rich content at the end if available
        if (richContent && richContent.length > 0) {
            yield { text, richContent };
        }
    } catch (error: any) {
        console.error("Gemini API error in getChatResponseStream:", error);
        yield "Pahoittelut, tekoälyyn ei saatu yhteyttä. Yritä myöhemmin uudelleen.";
    }
}

export const getConversationSummary = async (conversation: Conversation): Promise<string> => {
    try {
        const result = await geminiConversationSummaryCallable({ conversation });
        return result.data.summary;
    } catch (error) {
        console.error("Error generating conversation summary:", error);
        throw new Error("Failed to generate summary.");
    }
};

export const generateTrainingDataFromText = async (text: string, title: string): Promise<Omit<KnowledgeSource, 'id'>[]> => {
    try {
        console.log(`Generating training data from text. Title: ${title}, Text length: ${text.length}`);
        
        if (!text || text.trim().length === 0) {
            console.warn('Empty text provided to generateTrainingDataFromText');
            return [];
        }
        
        const result = await geminiGenerateTrainingDataCallable({ text, title });
        return result.data.data;
    } catch (error) {
        console.error("Error generating training data:", error);
        return [];
    }
};

export const analyzeConversations = async (conversations: Conversation[]): Promise<AnalysisResult> => {
    try {
        const result = await geminiAnalyzeConversationsCallable({ conversations });
        return result.data;
    } catch (error) {
        console.error("Error analyzing conversations:", error);
        throw new Error("Failed to analyze conversations. The AI model might be temporarily unavailable.");
    }
};

export const translateText = async (text: string, targetLanguage: 'fi' | 'en'): Promise<string> => {
    try {
        const result = await geminiTranslateTextCallable({ text, targetLanguage });
        return result.data.translatedText;
    } catch (error) {
        console.error("Error translating text:", error);
        return text; // Return original text if translation fails
    }
};
