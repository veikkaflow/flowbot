import { useState, useCallback } from 'react';
import { Bot, KnowledgeSource, ScrapedData } from '../types.ts';
import { scrapeWebsite, ScrapeMode } from '../services/scraperService.ts';
import { generateTrainingDataFromText } from '../services/geminiService.ts';
import { botTemplates } from '../data/defaultBots.ts';
import { auth } from '../services/firebase.ts';
import { getStarterAvatars } from '../data/avatars.ts';

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
    const [scrapeMode, setScrapeMode] = useState<ScrapeMode>('default');


    const startScraping = useCallback(async (url: string, mode: ScrapeMode = 'default') => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('=== STARTING SCRAPING ===');
            console.log('URL:', url);
            
            // Store URL for later use
            setWebsiteUrl(url);
            
            const data = await scrapeWebsite(url, mode, true);
            console.log('=== SCRAPED DATA RECEIVED ===');
            console.log('Full data:', JSON.stringify(data, null, 2));
            console.log('Title:', data.title);
            console.log('Logos:', data.logos, 'Length:', data.logos?.length);
            console.log('Colors:', data.colors, 'Length:', data.colors?.length);
            console.log('Text length:', data.text?.length);
            
            // Ensure arrays exist
            const logos = Array.isArray(data.logos) ? data.logos : [];
            const colors = Array.isArray(data.colors) && data.colors.length > 0 
                ? data.colors 
                : ['#4f46e5', '#1f2937', '#3b82f6', '#10b981', '#f59e0b'];
            
            console.log('Normalized logos:', logos);
            console.log('Normalized colors:', colors);
            
            // Create normalized scraped data
            const normalizedData = {
                ...data,
                logos: logos,
                colors: colors
            };
            
            setScrapedData(normalizedData);
            
            const title = data.title || 'Uusi Botti';
            const firstLogo = logos.length > 0 ? logos[0] : null;
            const firstColor = colors[0] || '#3b82f6';
            const secondColor = colors[1] || '#1f2937';
            
            console.log('=== SETTING STATE ===');
            console.log('Setting brandName to:', title);
            console.log('Setting selectedLogo to:', firstLogo);
            console.log('Setting selectedColor to:', firstColor);
            console.log('Setting selectedHeaderColor to:', secondColor);
            
            setBrandName(title);
            setSelectedLogo(firstLogo);
            setSelectedColor(firstColor);
            setSelectedHeaderColor(secondColor);
            
            // Generate Q&A data from scraped text
            if (data.text && data.text.trim().length > 0) {
                console.log('Generating Q&A data from text, length:', data.text.length);
                try {
                    const training = await generateTrainingDataFromText(data.text, data.title || title);
                    console.log('Generated Q&A data:', training.length, 'items');
                    setGeneratedQnaData(training);
                } catch (error) {
                    console.error('Error generating Q&A data:', error);
                    // Don't fail the whole process if Q&A generation fails
                    setGeneratedQnaData([]);
                }
            } else {
                console.warn('No text content found, skipping Q&A generation');
                setGeneratedQnaData([]);
            }

            setStep(2);
        } catch (e: any) {
            console.error('Scraping error:', e);
            setError(e.message || "Sivuston analysointi epäonnistui.");
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    const finalizeSetup = useCallback(async () => {
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

        // Hae starter-avatit Firebase Storagesta
        let starterAvatars;
        try {
            starterAvatars = await getStarterAvatars();
        } catch (error) {
            console.error('Error loading starter avatars:', error);
            // Käytä tyhjiä listoja jos kuvia ei löydy
            starterAvatars = {
                userAvatars: [],
                botAvatars: [],
                agentAvatars: [],
            };
        }

        console.log('=== FINALIZING SETUP ===');
        console.log('Brand name:', brandName);
        console.log('Selected logo:', selectedLogo);
        console.log('Selected color:', selectedColor);
        console.log('Selected header color:', selectedHeaderColor);
        console.log('Scraped data:', scrapedData);
        console.log('Scraped data logos:', scrapedData?.logos);
        console.log('Scraped data colors:', scrapedData?.colors);
        console.log('Website URL:', websiteUrl);
        console.log('Generated Q&A data count:', generatedQnaData.length);
        console.log('Template Q&A data count:', template.settings.qnaData?.length || 0);
        
        // Use scraped data colors if available, otherwise use selected colors
        const finalPrimaryColor = selectedColor || scrapedData?.colors?.[0] || template.settings.appearance.primaryColor;
        const finalHeaderColor = selectedHeaderColor || scrapedData?.colors?.[1] || template.settings.appearance.headerColor;
        const finalLogo = selectedLogo || scrapedData?.logos?.[0] || undefined;
        const finalLogoGallery = scrapedData?.logos && scrapedData.logos.length > 0 
            ? scrapedData.logos 
            : (selectedLogo ? [selectedLogo] : []);
        
        console.log('Final colors - Primary:', finalPrimaryColor, 'Header:', finalHeaderColor);
        console.log('Final logo:', finalLogo);
        console.log('Final logo gallery:', finalLogoGallery);
        
        const qnaDataWithIds = generatedQnaData.map(item => ({ 
            ...item, 
            id: `gen_${Date.now()}_${Math.random()}` 
        }));
        
        console.log('Q&A data to save:', qnaDataWithIds.length, 'items');
        if (qnaDataWithIds.length > 0) {
            console.log('First Q&A item:', qnaDataWithIds[0]);
        }
        
        // Käytä starter-avatit jos saatavilla, muuten käytä templaten avatareja
        const userAvatarGallery = starterAvatars.userAvatars.length > 0 
            ? starterAvatars.userAvatars 
            : template.settings.avatarSettings.userAvatarGallery;
        const botAvatarGallery = starterAvatars.botAvatars.length > 0 
            ? starterAvatars.botAvatars 
            : template.settings.avatarSettings.botAvatarGallery;
        const agentAvatarGallery = starterAvatars.agentAvatars.length > 0 
            ? starterAvatars.agentAvatars 
            : template.settings.avatarSettings.agentAvatarGallery;

        // Valitse ensimmäinen kuva jos lista ei ole tyhjä
        const selectedUserAvatar = userAvatarGallery[0] || template.settings.avatarSettings.selectedUserAvatar;
        const selectedBotAvatar = botAvatarGallery[0] || template.settings.avatarSettings.selectedBotAvatar;
        const selectedAgentAvatar = agentAvatarGallery[0] || template.settings.avatarSettings.selectedAgentAvatar;

        const newBot: Omit<Bot, 'id'> = {
            name: brandName || scrapedData?.title || 'Uusi Botti',
            ownerId: user.uid,
            templateId: template.id,
            settings: {
                ...template.settings,
                appearance: {
                    ...template.settings.appearance,
                    brandName: brandName || scrapedData?.title || template.settings.appearance.brandName,
                    brandLogo: finalLogo,
                    logoGallery: finalLogoGallery,
                    primaryColor: finalPrimaryColor,
                    headerColor: finalHeaderColor,
                    websiteUrl: websiteUrl,
                },
                avatarSettings: {
                    userAvatarGallery: userAvatarGallery,
                    botAvatarGallery: botAvatarGallery,
                    agentAvatarGallery: agentAvatarGallery,
                    selectedUserAvatar: selectedUserAvatar,
                    selectedBotAvatar: selectedBotAvatar,
                    selectedAgentAvatar: selectedAgentAvatar,
                },
                qnaData: [
                    ...(template.settings.qnaData || []),
                    ...qnaDataWithIds
                ],
            }
        };
        
        console.log('=== BOT CREATED ===');
        console.log('Bot name:', newBot.name);
        console.log('Bot appearance:', JSON.stringify(newBot.settings.appearance, null, 2));
        console.log('Bot Q&A data count:', newBot.settings.qnaData.length);
        
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
