// Configuration file for all instructions, messages, and texts used in functions
// This makes it easy to modify instructions and messages without touching the main logic

export const config = {
  // Tool descriptions for Gemini API
  tools: {
    getProducts: {
      description: "Hae tuotetietoja tuotekatalogista. Voit suodattaa tuotteita kategorian tai hakusanan perusteella.",
      parameters: {
        category: 'Tuotekategoria, esim. "televisiot", "puhelimet", "kamerat".',
        searchTerm: 'Vapaa hakusana, jolla etsiä tuotteita nimestä tai kuvauksesta, esim. "OLED" tai "Samsung".',
      },
    },
    submitContactForm: {
      description: "Lähetä yhteydenottolomake käyttäjälle. Käytä tätä työkalua KUN käyttäjä pyytää yhteydenottoa, haluaa ottaa yhteyttä, pyytää tietoja, haluaa lähettää viestin, tai sanoo 'lähetä yhteydenotto', 'haluan ottaa yhteyttä', 'yhteydenottolomake' tai vastaavaa. Jos käyttäjällä ei ole vielä kaikkia tarvittavia tietoja (nimi, sähköposti, viesti), kysy ne ensin ja käytä sitten tätä työkalua.",
      parameters: {
        name: "Käyttäjän nimi. Jos nimi ei ole saatavilla, käytä 'Vierailija' tai kysy nimeä ensin.",
        email: "Käyttäjän sähköpostiosoite. Jos sähköposti ei ole saatavilla, kysy se ensin käyttäjältä.",
        message: "Käyttäjän viesti tai yhteydenottopyyntö. Jos viesti ei ole saatavilla, käytä 'Yhteydenottopyyntö' tai kysy viestiä käyttäjältä.",
      },
    },
    submitQuoteRequest: {
      description: "Lähetä tarjouspyyntölomake. Käytä tätä kun käyttäjä pyytää tarjousta tai hinnan arviota.",
      parameters: {
        name: "Käyttäjän nimi",
        email: "Sähköpostiosoite",
        company: "Yrityksen nimi (valinnainen)",
        details: "Tarjouspyynnön yksityiskohdat",
      },
    },
    searchKnowledgeBase: {
      description: "Hae tietopankista tietoja. Käytä tätä kun tarvitset spesifistä tietoa tuotteista, palveluista tai dokumenteista.",
      parameters: {
        query: "Hakusana tai kysymys",
        maxResults: "Maksimimäärä tuloksia (1-10)",
      },
    },
  },

  // System instruction templates
  systemInstructions: {
    base: {
      intro: (brandName: string) => `You are a helpful customer service chatbot for ${brandName}.\n`,
      tone: (tone: string) => `Your tone should be: ${tone}.\n`,
      language: {
        fi: "Always respond in Finnish. All your responses must be in Finnish.\n",
        en: "Always respond in English. All your responses must be in English.\n",
      },
      askForName: "Always ask for the customer's name at the start of the conversation.\n",
    },
    tools: {
      header: "\n=== TYÖKALUJEN KÄYTTÖ ===\n",
      intro: "Sinulla on käytössäsi seuraavat työkalut. Käytä niitä AKTIIVISESTI kun tilanne vaatii:\n\n",
      contactForm: {
        header: "1. submitContactForm - Käytä tätä kun:\n",
        defaultRules: [
          "- Käyttäjä pyytää yhteydenottoa, sanoo \"lähetä yhteydenotto\", \"haluan ottaa yhteyttä\"",
          "- Käyttäjä haluaa lähettää viestin tai kysyä jotain",
          "- Käyttäjä pyytää tietoja tai apua",
        ],
        important: "   TÄRKEÄÄ: Jos käyttäjä pyytää suoraan \"lähetä yhteydenotto\", kysy ensin tarvittavat tiedot (nimi, sähköposti, viesti) ja käytä sitten työkalua HETI.\n\n",
      },
      quoteRequest: {
        header: "2. submitQuoteRequest - Käytä tätä kun:\n",
        defaultRules: [
          "- Käyttäjä pyytää tarjousta tai hinnan arviota",
          "- Käyttäjä kysyy hintoja tai hintatietoja",
          "- Käyttäjä haluaa saada tarjouksen",
        ],
        important: "   TÄRKEÄÄ: Jos käyttäjä pyytää tarjousta, kysy ensin tarvittavat tiedot (nimi, sähköposti, tarjouksen yksityiskohdat) ja käytä sitten työkalua HETI.\n\n",
      },
      getProducts: "3. getProducts - Käytä kun käyttäjä kysyy tuotteista.\n\n",
      searchKnowledgeBase: "4. searchKnowledgeBase - Käytä kun tarvitset lisätietoja dokumenteista.\n\n",
      usageGuidelines: {
        header: "TYÖKALUJEN KÄYTTÖOHJE:\n",
        rules: [
          "- Kun käyttäjä pyytää jotain, joka vaatii työkalua, käytä sitä AKTIIVISESTI",
          "- Jos tarvitset tietoja käyttäjältä ennen työkalun käyttöä, kysy ne ENSIN",
          "- Kun sinulla on kaikki tarvittavat tiedot, käytä työkalua HETI - älä vain kerro että voit tehdä sen",
          "- Älä odota että käyttäjä pyytää työkalun käyttöä eksplisiittisesti - tunnista tarve ja käytä työkalua",
        ],
      },
    },
    qna: {
      header: "Vastaa näihin kysymyksiin tarkasti seuraavasti:\n",
      format: (question: string, answer: string) => `Q: ${question}\nA: ${answer}\n`,
    },
  },

  // Response messages
  messages: {
    contactForm: {
      success: "Yhteydenottolomake lähetetty onnistuneesti. Vastaamme sinulle mahdollisimman pian.",
      error: "Lomakkeen lähetys epäonnistui. Yritä myöhemmin uudelleen.",
    },
    quoteRequest: {
      success: "Tarjouspyyntö lähetetty onnistuneesti. Lähetämme tarjouksen sinulle mahdollisimman pian.",
      error: "Tarjouspyynnön lähetys epäonnistui. Yritä myöhemmin uudelleen.",
    },
    knowledgeBase: {
      empty: "Tietopankki on tyhjä.",
      error: "Tietopankin haku epäonnistui.",
    },
    products: {
      error: "Tuotteiden haku epäonnistui.",
    },
  },

  // RAG (Retrieval Augmented Generation) prompts: tietopanin määritykset. Milloin tietopankki käytetään ja milloin ei.
  rag: {
    needsKnowledgeBase: {
      prompt: (conversationContext: string, userQuestion: string) => `Analysoi seuraava käyttäjän kysymys ja keskusteluhistoria.

Keskusteluhistoria:
${conversationContext || "(Ei aiempaa keskustelua)"}

Uusi kysymys: "${userQuestion}"

Päätä, tarvitaanko tietopankin tietoja vastataksesi tähän kysymykseksi.
Tietopankkia tarvitaan jos:
- Kysymys koskee tuotteita, palveluja tai yrityksen tietoja
- Kysymys vaatii spesifistä tietoa (hinnat, tekniset tiedot, dokumentit, jne.)
- Kysymys liittyy dokumentteihin tai tiedostoihin tietopankissa

Tietopankkia EI tarvita jos:
- Kysymys on yleinen tervehdys tai kiitos
- Vastaus löytyy asetuksista kuten qa osiosta tai system instructionissa
- Kysymys on keskustelua tai small talk
- Vastaus voidaan antaa yleisellä tiedolla ilman dokumentteja

Palauta vastaus JSON-muodossa: { "needsKnowledgeBase": true/false, "reason": "lyhyt selitys" }`,
      responseSchema: {
        needsKnowledgeBase: "Tarvitaanko tietopankkia",
        reason: "Lyhyt selitys päätökselle",
      },
    },
    selectRelevantSources: {
      prompt: (userQuestion: string, knowledgeSourceMetadata: string) => `Käyttäjä kysyy: "${userQuestion}"

Seuraavat knowledge source -tiedostot ovat saatavilla:
${knowledgeSourceMetadata}

Valitse 3-5 tiedostoa, jotka ovat todennäköisimmin relevantteja vastataksesi kysymykseen.
Palauta vastaus JSON-muodossa listana ID-numeroita, esim: ["0", "2", "5"]`,
      responseSchema: {
        selectedIds: "Lista valittujen tiedostojen ID-numeroista (3-5 kpl)",
      },
    },
    knowledgeBasePrefix: {
      withQnA: "TÄRKEÄÄ: Käytä seuraavaa tietopankkia VAIN jos system instructionissa olevat Q&A-vastaukset eivät vastaa kysymykseeni. Jos Q&A-vastaukset sisältävät vastauksen, käytä niitä eikä tietopankkia.\n\n",
      withoutQnA: "Käytä seuraavaa tietopankkia vastataksesi kysymykseeni:\n\n",
    },
  },

  // Analysis prompts: keskustelun analyysi ja parannusehdotukset. Käytetään yhteenvedoissa
  analysis: {
    conversationSummary: {
      prompt: (conversationText: string) => `Provide a concise, one-paragraph summary of the following customer service chat conversation. The summary should be in Finnish.

Conversation:
${conversationText.substring(0, 15000)}

Summary:`,
    },
    trainingData: {
      prompt: (text: string, title: string) => `From the following text from the website "${title}", generate a list of 5-10 frequently asked questions and their corresponding answers. The questions should be things a customer would likely ask.

Text:
${text.substring(0, 15000)}

Return the result as a JSON array of objects, where each object has a "question" and "answer" property.`,
      responseSchema: {
        question: "The customer's question.",
        answer: "The answer to the question.",
      },
    },
    conversations: {
      prompt: (conversationData: string) => `Analyze the following customer service chat conversations. Provide a concise summary, list the key feedback points from customers, and suggest 3 concrete improvements for the business based on the conversations.

Conversations:
${conversationData.substring(0, 15000)}

Return the result as a single JSON object.`,
      responseSchema: {
        summary: "A brief summary of all conversations.",
        keyFeedback: "A list of key feedback points or common issues.",
        improvementSuggestions: "A list of actionable improvement suggestions for the business.",
      },
    },
  },

  // Translation prompts
  translation: {
    fiToEn: (text: string) => `Translate the following Finnish text to English. Only return the translation, nothing else:\n\n${text}`,
    enToFi: (text: string) => `Translate the following English text to Finnish. Only return the translation, nothing else:\n\n${text}`,
  },

  // Mock data (for testing)
  mockData: {
    products: [
      { id: "TV001", name: 'Samsung 55" 4K Smart OLED TV', price: "1299€", stock: 15, description: "Upea kuvanlaatu ja ohuet reunat." },
      { id: "TV002", name: 'LG 65" QNED MiniLED TV', price: "1899€", stock: 8, description: "Kirkas kuva ja erinomainen kontrasti." },
      { id: "TV003", name: 'Sony 50" Bravia Full HD', price: "799€", stock: 22, description: "Luotettava perustelevisio hyvällä kuvalla." },
    ],
  },
};

