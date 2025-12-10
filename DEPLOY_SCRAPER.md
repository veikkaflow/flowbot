# Scrapy Firebase Functions - Deployohjeet

Yksinkertainen Scrapy-spider Firebase Functionsissa.

## Vaihe 1: Varmista että Firebase CLI on asennettuna

```bash
firebase --version
```

Jos ei ole asennettuna:
```bash
npm install -g firebase-tools
```

## Vaihe 2: Kirjaudu Firebaseen

```bash
firebase login
```

## Vaihe 3: Varmista projekti

```bash
firebase use gen-lang-client-0746010330
```

Tai tarkista nykyinen projekti:
```bash
firebase projects:list
```

## Vaihe 4: Ota Python Functions käyttöön

Firebase Functions Python-tuki vaatii Firebase CLI:n version 11.0.0 tai uudemman.

Tarkista versio:
```bash
firebase --version
```

Jos versio on vanhempi, päivitä:
```bash
npm install -g firebase-tools@latest
```

## Vaihe 5: Deployaa Python Function

Siirry projektin juureen ja deployaa:

```bash
firebase deploy --only functions:scrape_website
```

**HUOM:** Ensimmäinen deploy voi kestää 5-10 minuuttia, koska Firebase buildaa Python-ympäristön.

## Vaihe 6: Hae Function URL

Deployauksen jälkeen saat Function URL:n. Se näyttää tältä:

```
https://YOUR-REGION-gen-lang-client-0746010330.cloudfunctions.net/scrape_website
```

Tallenna tämä URL!

## Vaihe 7: Päivitä React-koodi

Päivitä `services/siteScraperService.ts`:

```typescript
// Vaihda URL Firebase Function URL:ksi
const SCRAPER_SERVICE_URL = 'https://YOUR-REGION-gen-lang-client-0746010330.cloudfunctions.net/scrape_website';
```

Tai käytä Firebase Functions SDK:ta (suositeltu):

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const scrapeWebsite = httpsCallable(functions, 'scrape_website');

export const scrapeSite = async (url: string): Promise<ScrapedData> => {
  try {
    const result = await scrapeWebsite({ url });
    return result.data as ScrapedData;
  } catch (error: any) {
    console.warn('Scraping failed:', error);
    // Fallback to mock data
    return getMockData(url);
  }
};
```

## Vaihe 8: Testaa

Testaa Function suoraan:

```bash
curl -X POST https://YOUR-REGION-gen-lang-client-0746010330.cloudfunctions.net/scrape_website \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Tai testaa React-sovelluksesta.

## Ongelmatilanteet

### Python Functions ei ole käytettävissä

Jos saat virheen "Python runtime not available", varmista että:
1. Firebase CLI on versio 11.0.0 tai uudempi
2. Firebase-projektissasi on otettu käyttöön Cloud Functions API
3. Käytät oikeaa Firebase-projektia

### Deploy epäonnistuu

Tarkista logit:
```bash
firebase functions:log
```

### Timeout-ongelmat

Firebase Functions 1. gen timeout on 60 sekuntia. Jos tarvitset pidemmän ajan, käytä 2. gen Functions:

Päivitä `firebase.json`:
```json
{
  "functions": [
    {
      "source": "functions-python",
      "codebase": "python-scraper",
      "runtime": "python311",
      "timeout": "540s"
    }
  ]
}
```

## Päivitykset

Kun teet muutoksia koodiin:

```bash
firebase deploy --only functions:scrape_website
```

## Kustannukset

- Firebase Functions on maksuton ensimmäiset 2 miljoonaa pyyntöä/kk
- Sitten ~$0.40/miljoona pyyntöä
- Muisti ja CPU-laskutus per käyttötunti

## Rakenne

```
functions-python/
├── main.py                    # Firebase Function entry point
├── requirements.txt           # Python dependencies
├── scrapy.cfg                # Scrapy configuration
└── scraper/
    ├── __init__.py
    ├── settings.py           # Scrapy settings
    └── spiders/
        ├── __init__.py
        └── website_spider.py # Scrapy spider
```

## Yksinkertaisuus

- ✅ Vain Scrapy + functions-framework
- ✅ Ei Flaskia, ei ScrapyRT:ä, ei Cloud Runia
- ✅ Kaikki samassa projektissa
- ✅ Automaattinen skaalaus
- ✅ Yksinkertainen deploy

