import { ScrapedData } from '../types.ts';
import { functions } from './firebase.ts';
import { httpsCallable } from 'firebase/functions';

const toAbsoluteUrl = (baseUrl: string, relativeUrl: string): string => {
  try {
    if (relativeUrl.startsWith('http') || relativeUrl.startsWith('//')) {
      return new URL(relativeUrl, baseUrl).href;
    }
    return new URL(relativeUrl, baseUrl).href;
  } catch (e) {
    console.warn(`Could not create absolute URL for base: ${baseUrl}, relative: ${relativeUrl}`);
    return '';
  }
};

const getMockHtmlForUrl = (url: string): { html: string, title: string, text: string } => {
    const hostname = new URL(url).hostname;

    if (hostname.includes('lamnia')) {
        return {
            title: "Lamnia",
            text: "Lamnia on erikoistunut laadukkaisiin veitsiin ja retkeilyvarusteisiin. Tarjoamme nopean toimituksen ja laajan valikoiman kansainvälisiä huippumerkkejä. Asiakaspalvelumme auttaa sinua löytämään juuri oikeat tuotteet tarpeisiisi.",
            html: `
                <html><head><title>Lamnia - Veitset ja varusteet</title><link rel="icon" href="/favicon.png"></head>
                <body><header><img src="/images/lamnia-logo-header.svg" alt="Lamnia Logo"></header>
                <p>Laaja valikoima ulkoilutuotteita.</p></body></html>`
        };
    }
    if (hostname.includes('aaltovoima')) {
         return {
            title: "Aaltovoima Energia",
            text: "Aaltovoima on paikallinen energiayhtiösi. Tarjoamme luotettavaa ja edullista sähköä kotitalouksille ja yrityksille. Tee sähkösopimus helposti netissä tai ota yhteyttä asiakaspalveluumme. Autamme myös energia-asioissa ja sähkökatkoissa.",
            html: `
                <html><head><title>Aaltovoima</title></head>
                <body><div class="logo-container"><img src="https://aaltovoima.fi/static/logo.png"></div>
                <h1>Luotettavaa energiaa</h1></body></html>`
        };
    }
     if (hostname.includes('atflow')) {
         return {
            title: "atFlow Oy",
            text: "atFlow on tekoälyratkaisuihin erikoistunut yritys. Kehitämme älykkäitä chatbot- ja automaatioratkaisuja, jotka tehostavat asiakaspalvelua ja myyntiä. Ota yhteyttä ja keskustellaan, miten voimme auttaa teidän liiketoimintaanne kasvamaan.",
            html: `
                <html><head><title>atFlow - Tekoälyratkaisut</title><link rel="shortcut icon" href="https://atflow.fi/favicon.ico"></head>
                <body><nav><a href="/"><img id="main-logo" src="https://atflow.fi/logo.svg"/></a></nav>
                <p>Tehosta liiketoimintaasi tekoälyllä.</p></body></html>`
        };
    }
    // Default fallback
    return {
        title: "Geneerinen Yritys",
        text: "Tämä on simuloitu tekstisisältö sivustolta. Asiakaspalvelumme palvelee arkisin klo 9-17. Meiltä löydät parhaat tuotteet ja palvelut. Ota yhteyttä sähköpostitse info@example.com tai puhelimitse 010 123 4567.",
        html: `<html><head><title>Geneerinen Yritys</title></head><body><img src="/logo.png"></body></html>`
    };
}

/**
 * Scrapes a website using Firebase Cloud Function
 * Falls back to mock data if function is not available or fails
 */
export const scrapeSite = async (url: string): Promise<ScrapedData> => {
    console.log(`Scraping website: ${url}`);
    
    try {
        // Try to use Firebase Cloud Function
        const scrapeWebsite = httpsCallable(functions, 'scrapeWebsite');
        const result = await scrapeWebsite({ url });
        const data = result.data as ScrapedData;
        
        console.log('Successfully scraped website via Cloud Function');
        return data;
    } catch (error: any) {
        console.warn('Cloud Function scraping failed, falling back to mock data:', error.message);
        
        // Fallback to mock data
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (url.includes("fail")) {
            throw new Error("Sivuston analysointi epäonnistui. Palvelin ei vastannut.");
        }
        
        const { html: mockHtmlContent, title, text } = getMockHtmlForUrl(url);
        const foundLogos = new Set<string>();

        const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/g;
        let match;
        while ((match = imgRegex.exec(mockHtmlContent)) !== null) {
          const src = match[1];
          const fullTag = match[0].toLowerCase();
          const isLikelyLogo = fullTag.includes('logo') || src.includes('logo');
          if (isLikelyLogo) {
            const absoluteUrl = toAbsoluteUrl(url, src);
            if (absoluteUrl) foundLogos.add(absoluteUrl);
          }
        }
        
        const faviconRegex = /<link[^>]+rel="[^"]*icon[^"]*"[^>]+href="([^">]+)"/g;
        const faviconMatch = faviconRegex.exec(mockHtmlContent);
        if (faviconMatch) {
          const absoluteUrl = toAbsoluteUrl(url, faviconMatch[1]);
          if(absoluteUrl) foundLogos.add(absoluteUrl);
        }
        
        try {
            const hostname = new URL(url).hostname;
            foundLogos.add(`https://logo.clearbit.com/${hostname}`);
        } catch(e) { /* ignore invalid URLs */ }

        return {
            title: title,
            text: text,
            logos: Array.from(foundLogos),
            colors: [ '#4f46e5', '#1f2937', '#3b82f6', '#10b981', '#f59e0b' ],
        };
    }
};

export const scrapeTextFromUrl = async (url: string): Promise<string> => {
    console.log(`Scraping text content for: ${url}`);
    const data = await scrapeSite(url);
    return data.text;
};
