# Firebase Functions - Gemini AI

Tämä kansio sisältää Firebase Functions -endpointit Gemini AI -kutsuille.

## Asennus

1. Asenna riippuvuudet:
```bash
cd functions
npm install
```

2. Buildaa TypeScript-koodi:
```bash
npm run build
```

## API-avaimen asetus

Aseta Gemini API -avain Firebase Functions -konfiguraatioon:

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY_HERE"
```

Tarkista että se asetettiin oikein:
```bash
firebase functions:config:get
```

## Deploy

Deployaa kaikki Functions:
```bash
firebase deploy --only functions
```

Tai deployaa vain tietty funktio:
```bash
firebase deploy --only functions:geminiChatStream
```

## Saatavilla olevat funktiot

- `geminiChatStream` - Chat-vastaukset
- `geminiConversationSummary` - Keskustelun yhteenveto
- `geminiGenerateTrainingData` - Q&A-datan generointi tekstistä
- `geminiAnalyzeConversations` - Keskustelujen analyysi
- `geminiTranslateText` - Tekstin kääntäminen

## Paikallinen testaus

Käytä Firebase Emulatorsia:
```bash
npm run serve
```

Tai deployaa ja testaa suoraan:
```bash
firebase deploy --only functions:geminiChatStream
```

## Huomioita

- API-avain on nyt turvallisesti Firebase Functions -ympäristössä
- Client-puoli ei enää näe API-avainta
- Kaikki Gemini-kutsut tehdään Functions-puolella

