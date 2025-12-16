
import { ScrapedData } from '../types.ts';
import { auth } from './firebase.ts';

// Firebase Function URL - replace with your actual function URL
const FUNCTION_URL = process.env.SCRAPE_URL;

/**
 * Scrapes a website using Firebase Function scraper service
 * Uses direct HTTP call to handle raw JSON response (not wrapped in 'data' field)
 * Throws error if service fails - no fallback to mock data
 */
export const scrapeSite = async (url: string): Promise<ScrapedData> => {
    console.log(`=== SCRAPING WEBSITE ===`);
    console.log(`URL: ${url}`);
    
    try {
        // Get auth token for authenticated requests
        const user = auth.currentUser;
        let authToken: string | null = null;
        
        if (user) {
            authToken = await user.getIdToken();
            console.log('Using authenticated request');
        } else {
            console.log('Using unauthenticated request');
        }
        
        // Call Firebase Function directly via HTTP
        console.log('Calling Firebase Function via HTTP:', FUNCTION_URL);
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(FUNCTION_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ url }),
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Parse JSON response directly (not wrapped in 'data' field)
        const data: ScrapedData = await response.json();
        
        console.log('Raw JSON response from Firebase Function:', JSON.stringify(data, null, 2));
        console.log('Data type:', typeof data);
        console.log('Data keys:', data ? Object.keys(data) : 'null');
        
        // Validate response structure - ensure arrays exist and are arrays
        if (!data || typeof data !== 'object') {
            console.error('Validation failed: data is not an object', data);
            throw new Error('Invalid response: data is not an object');
        }
        
        if (!data.title || typeof data.title !== 'string') {
            console.error('Validation failed: title is missing or not a string', data.title);
            throw new Error('Invalid response: title is missing or not a string');
        }
        
        if (!data.text || typeof data.text !== 'string') {
            console.error('Validation failed: text is missing or not a string', typeof data.text);
            throw new Error('Invalid response: text is missing or not a string');
        }
        
        // Ensure logos and colors are arrays
        const logos = Array.isArray(data.logos) ? data.logos : [];
        const colors = Array.isArray(data.colors) ? data.colors : [];
        
        console.log(`=== VALIDATION SUCCESS ===`);
        console.log(`Title: ${data.title}`);
        console.log(`Logos: ${logos.length} items`);
        console.log(`Colors: ${colors.length} items`);
        console.log(`Text length: ${data.text.length} characters`);
        
        // Return normalized data
        const normalizedData: ScrapedData = {
            title: data.title,
            text: data.text,
            logos: logos,
            colors: colors.length > 0 ? colors : ['#4f46e5', '#1f2937', '#3b82f6', '#10b981', '#f59e0b']
        };
        
        console.log('=== SCRAPING SUCCESS ===');
        console.log('Normalized data:', JSON.stringify(normalizedData, null, 2));
        return normalizedData;
    } catch (error: any) {
        console.error('=== SCRAPING FAILED ===');
        console.error('Error:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // Throw error instead of using mock data
        const errorMessage = error.message || error.code || 'Tuntematon virhe';
        throw new Error(`Sivuston analysointi epäonnistui: ${errorMessage}`);
    }
};

export const scrapeTextFromUrl = async (url: string): Promise<string> => {
    console.log(`Scraping text content for: ${url}`);
    const data = await scrapeSite(url);
    return data.text;
};
