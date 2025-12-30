import { ScrapedData } from '../types.ts';
import { auth } from './firebase.ts';

export type ScrapeMode = 'default' | 'dataflow-vk' | 'dataflow-sites' | 'dataflow-travel';

/**
 * Scrapes a website using Firebase Function scraper service
 * Returns ScrapedData with text content, logos, colors, and additional structured data
 * Mode vaikuttaa vain palautuvaan dataan (backend käsittelee moden)
 */
export const scrapeWebsite = async (
    url: string,
    mode: ScrapeMode = 'default',
    useAuth: boolean = false
): Promise<ScrapedData> => {
    console.log(`=== SCRAPING WEBSITE ===`);
    console.log(`URL: ${url}`);
    console.log(`Mode: ${mode}`);
    
    try {
        const FUNCTION_URL = process.env.SCRAPEDEMO_URL;
        
        if (!FUNCTION_URL) {
            throw new Error('Function URL not configured (SCRAPEDEMO_URL)');
        }
        
        // Get auth token if needed and available
        let authToken: string | null = null;
        if (useAuth) {
            const user = auth.currentUser;
            if (user) {
                authToken = await user.getIdToken();
                console.log('Using authenticated request');
            } else {
                console.log('Using unauthenticated request');
            }
        }
        
        // Prepare request headers
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // Prepare request body with mode
        const body = { 
            url,
            mode: mode
        };
        
        console.log('Calling Firebase Function via HTTP:', FUNCTION_URL);
        
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Parse JSON response - uusi muoto: { success, data: { colors, logos, content, ...additionalData }, metadata }
        const responseData = await response.json();
        
        console.log('Raw JSON response from Scraper:', JSON.stringify(responseData, null, 2));
        
        if (!responseData.success) {
            throw new Error('Scraping failed: success field is false');
        }
        
        const { data, metadata } = responseData;
        
        if (!data) {
            throw new Error('Invalid response: data field is missing');
        }
        
        // Extract known fields: colors, logos, content
        const colors = Array.isArray(data.colors) ? data.colors : [];
        const logos = Array.isArray(data.logos) ? data.logos : [];
        const textContent = data.content || '';
        
        // Extract additional structured data (services, products, testimonials, etc.)
        const additionalData: Record<string, any> = {};
        const knownKeys = ['colors', 'logos', 'content', 'title'];
        
        Object.keys(data).forEach(key => {
            if (!knownKeys.includes(key)) {
                const value = data[key];
                // Add only arrays or objects to additionalData
                if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    additionalData[key] = value;
                }
            }
        });
        
        // Extract title from metadata if available, otherwise use data.title or default
        const title = metadata?.title || data.title || 'Uusi Botti';
        
        const normalizedData: ScrapedData = {
            title: title,
            text: textContent,
            logos: logos,
            colors: colors.length > 0 ? colors : ['#4f46e5', '#1f2937', '#3b82f6', '#10b981', '#f59e0b'],
            additionalData: Object.keys(additionalData).length > 0 ? additionalData : undefined
        };
        
        console.log(`=== VALIDATION SUCCESS ===`);
        console.log(`Title: ${normalizedData.title}`);
        console.log(`Logos: ${normalizedData.logos.length} items`);
        console.log(`Colors: ${normalizedData.colors.length} items`);
        console.log(`Text length: ${normalizedData.text.length} characters`);
        if (normalizedData.additionalData) {
            console.log(`Additional data keys:`, Object.keys(normalizedData.additionalData));
        }
        
        console.log('=== SCRAPING SUCCESS ===');
        console.log('Normalized data:', JSON.stringify(normalizedData, null, 2));
        return normalizedData;
    } catch (error: any) {
        console.error('=== SCRAPING FAILED ===');
        console.error('Full error object:', JSON.stringify(error, null, 2));
        const errorMessage = error.message || error.code || 'Tuntematon virhe';
        throw new Error(`Sivuston analysointi epäonnistui: ${errorMessage}`);
    }
};

