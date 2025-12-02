import { useState, useCallback } from 'react';
import { Bot, KnowledgeSource, ScrapedData } from '../types.ts';
import { scrapeSite } from '../services/siteScraperService.ts';
import { generateTrainingDataFromText } from '../services/geminiService.ts';
import { botTemplates } from '../data/defaultBots.ts';
import { auth } from '../services/firebase.ts';

export const useAppSetup = (onSetupComplete: (bot: Omit<Bot, 'id'>) => void) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [websiteUrl, setWebsiteUrl] = useState('');

    const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
    const [generatedQnaData, setGeneratedQnaData] = useState<Omit<KnowledgeSource, 'id'>[]>([]);
    
    const [brandName, setBrandName] = useState('');
    const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedHeaderColor, setSelectedHeaderColor] = useState<string | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(botTemplates[0].id);


    const startScraping = useCallback(async (url: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await scrapeSite(url);
            setScrapedData(data);
            
            setBrandName(data.title || 'Uusi Botti');
            setSelectedLogo(data.logos[0] || null);
            setSelectedColor(data.colors[0] || '#3b82f6');
            setSelectedHeaderColor(data.colors[1] || '#1f2937');
            
            if (data.text) {
                const training = await generateTrainingDataFromText(data.text, data.title);
                setGeneratedQnaData(training);
            }

            setStep(2);
        } catch (e: any) {
            setError(e.message || "Sivuston analysointi epäonnistui.");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const finalizeSetup = useCallback(() => {
        const user = auth.currentUser;
        if (!user) {
            setError("Käyttäjä ei ole kirjautunut sisään.");
            return;
        }

        const template = botTemplates.find(t => t.id === selectedTemplateId);
        if (!template) {
            setError("Valittua mallipohjaa ei löytynyt.");
            return;
        }

        const newBot: Omit<Bot, 'id'> = {
            name: brandName,
            ownerId: user.uid,
            templateId: template.id,
            settings: {
                ...template.settings,
                appearance: {
                    ...template.settings.appearance,
                    brandName: brandName,
                    brandLogo: selectedLogo || undefined,
                    logoGallery: scrapedData?.logos || [selectedLogo].filter(Boolean) as string[],
                    primaryColor: selectedColor || template.settings.appearance.primaryColor,
                    headerColor: selectedHeaderColor || template.settings.appearance.headerColor,
                    websiteUrl: websiteUrl,
                },
                qnaData: [
                    ...template.settings.qnaData,
                    ...generatedQnaData.map(item => ({ ...item, id: `gen_${Date.now()}_${Math.random()}` }))
                ],
            }
        };
        
        onSetupComplete(newBot);
        
    }, [brandName, selectedColor, selectedHeaderColor, selectedLogo, scrapedData, websiteUrl, generatedQnaData, selectedTemplateId, onSetupComplete]);

    return {
        step,
        setStep,
        isLoading,
        error,
        websiteUrl,
        setWebsiteUrl,
        startScraping,
        scrapedData,
        brandName,
        setBrandName,
        selectedLogo,
        setSelectedLogo,
        selectedColor,
        setSelectedColor,
        selectedHeaderColor,
        setSelectedHeaderColor,
        selectedTemplateId,
        setSelectedTemplateId,
        finalizeSetup,
    };
};
