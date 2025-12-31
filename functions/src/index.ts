import * as functions from "firebase-functions";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import {
  Conversation,
  Message,
  AppSettings,
  KnowledgeSource,
  AnalysisResult,
} from "./types";

// Gemini API -avain Firebase Functions -ympäristömuuttujasta
const GEMINI_API_KEY = functions.config().gemini?.api_key;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not configured in Firebase Functions config");
  console.error("Set it with: firebase functions:config:set gemini.api_key=\"YOUR_KEY\"");
}

const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Helper function to get AI client
function getAiClient() {
  if (!genAI) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API key is not configured. Please set it using: firebase functions:config:set gemini.api_key=\"YOUR_KEY\""
    );
  }
  return genAI;
}

// Get Products Tool (same as client-side)
const getProductsTool: FunctionDeclaration = {
  name: "getProducts",
  description: "Hae tuotetietoja tuotekatalogista. Voit suodattaa tuotteita kategorian tai hakusanan perusteella.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'Tuotekategoria, esim. "televisiot", "puhelimet", "kamerat".',
      },
      searchTerm: {
        type: Type.STRING,
        description: 'Vapaa hakusana, jolla etsiä tuotteita nimestä tai kuvauksesta, esim. "OLED" tai "Samsung".',
      },
    },
    required: [],
  },
};

// Mock products API (same as client-side)
async function getProductsFromApi(category?: string, searchTerm?: string) {
  try {
    console.log(`Haetaan tuotteita... Kategoria: ${category}, Hakusana: ${searchTerm}`);
    
    // Simuloitu API-vastaus
    const mockApiResponse = [
      { id: "TV001", name: 'Samsung 55" 4K Smart OLED TV', price: "1299€", stock: 15, description: "Upea kuvanlaatu ja ohuet reunat." },
      { id: "TV002", name: 'LG 65" QNED MiniLED TV', price: "1899€", stock: 8, description: "Kirkas kuva ja erinomainen kontrasti." },
      { id: "TV003", name: 'Sony 50" Bravia Full HD', price: "799€", stock: 22, description: "Luotettava perustelevisio hyvällä kuvalla." },
    ];

    return mockApiResponse;
  } catch (error) {
    console.error("API call to getProducts failed:", error);
    return { error: "Tuotteiden haku epäonnistui." };
  }
}

// Dynaaminen RAG: Analysoi tarvitaanko knowledge base -tietoja
async function needsKnowledgeBase(
  userQuestion: string,
  conversationHistory: Message[]
): Promise<boolean> {
  try {
    const ai = getAiClient();
    
    const conversationContext = conversationHistory
      .slice(-4)
      .map((m) => `${m.sender}: ${m.text}`)
      .join("\n");
    
    const analysisPrompt = `Analysoi seuraava käyttäjän kysymys ja keskusteluhistoria.

Keskusteluhistoria:
${conversationContext || "(Ei aiempaa keskustelua)"}

Uusi kysymys: "${userQuestion}"

Päätä, tarvitaanko tietopankin tietoja vastataksesi tähän kysymykseen.
Tietopankkia tarvitaan jos:
- Kysymys koskee tuotteita, palveluja tai yrityksen tietoja
- Kysymys vaatii spesifistä tietoa (hinnat, tekniset tiedot, dokumentit, jne.)
- Kysymys liittyy dokumentteihin tai tiedostoihin tietopankissa

Tietopankkia EI tarvita jos:
- Kysymys on yleinen tervehdys tai kiitos
- Vastaus löytyy asetuksista kuten qa osiosta tai system instructionissa
- Kysymys on keskustelua tai small talk
- Vastaus voidaan antaa yleisellä tiedolla ilman dokumentteja

Palauta vastaus JSON-muodossa: { "needsKnowledgeBase": true/false, "reason": "lyhyt selitys" }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needsKnowledgeBase: {
              type: Type.BOOLEAN,
              description: "Tarvitaanko tietopankkia"
            },
            reason: {
              type: Type.STRING,
              description: "Lyhyt selitys päätökselle"
            }
          },
          required: ["needsKnowledgeBase", "reason"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      console.error("Empty response from Gemini API");
      return true; // Fallback: käytetään tietopankkia
    }

    const result = JSON.parse(responseText);
    console.log(`[RAG] Knowledge base needed: ${result.needsKnowledgeBase}, reason: ${result.reason}`);
    return result.needsKnowledgeBase;
  } catch (error) {
    console.error("Error analyzing if knowledge base is needed:", error);
    return true; // Fallback: käytetään tietopankkia
  }
}

// Dynaaminen RAG: Valitse relevantit knowledge source -tiedostot
async function selectRelevantKnowledgeSources(
  userQuestion: string,
  knowledgeBase: KnowledgeSource[]
): Promise<string[]> {
  try {
    const ai = getAiClient();
    
    if (knowledgeBase.length <= 5) {
      console.log(`[RAG] Small knowledge base (${knowledgeBase.length} items), using all`);
      return knowledgeBase.map((_, idx) => idx.toString());
    }
    
    const knowledgeSourceMetadata = knowledgeBase.map((kb, index) => ({
      id: index.toString(),
      name: kb.name,
      type: kb.type,
      preview: kb.content.substring(0, 300),
    }));
    
    const selectionPrompt = `Käyttäjä kysyy: "${userQuestion}"

Seuraavat knowledge source -tiedostot ovat saatavilla:
${knowledgeSourceMetadata.map((kb) =>
  `[${kb.id}] ${kb.name} (${kb.type})\nEsikatselu: ${kb.preview}...`
).join("\n\n")}

Valitse 3-5 tiedostoa, jotka ovat todennäköisimmin relevantteja vastataksesi kysymykseen.
Palauta vastaus JSON-muodossa listana ID-numeroita, esim: ["0", "2", "5"]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: selectionPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista valittujen tiedostojen ID-numeroista (3-5 kpl)"
            }
          },
          required: ["selectedIds"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      console.error("Empty response from Gemini API");
      return knowledgeBase.slice(0, 5).map((_, idx) => idx.toString());
    }

    const result = JSON.parse(responseText);
    const selectedIds = result.selectedIds || [];
    
    const validIds = selectedIds.filter((id: string) => {
      const idx = parseInt(id);
      return !isNaN(idx) && idx >= 0 && idx < knowledgeBase.length;
    });
    
    const finalIds = validIds.length > 0
      ? validIds
      : knowledgeBase.slice(0, 5).map((_, idx) => idx.toString());
    
    console.log(`[RAG] Selected ${finalIds.length} relevant knowledge sources: ${finalIds.join(", ")}`);
    return finalIds;
  } catch (error) {
    console.error("Error selecting relevant knowledge sources:", error);
    return knowledgeBase.slice(0, 5).map((_, idx) => idx.toString());
  }
}

// Rakentaa keskustelun sisällön käyttäen knowledge base -tietoja
async function buildChatContents(
  conversation: Conversation,
  settings: AppSettings
): Promise<Array<{ role: "user" | "model"; parts: Array<{ text: string } | { functionCall?: any } | { functionResponse?: any }> }>> {
  const contents: Array<{ role: "user" | "model"; parts: Array<any> }> = [];

  // Lisätään skenaariot
  settings.personality.scenarios.forEach((scenario) => {
    contents.push({ role: "user", parts: [{ text: scenario.userMessage }] });
    contents.push({ role: "model", parts: [{ text: scenario.botResponse }] });
  });

  const messages = conversation.messages;
  
  let lastUserMessageIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "user") {
      lastUserMessageIndex = i;
      break;
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (message.sender === "user") {
      let userText = message.text;

      if (settings.knowledgeBase && settings.knowledgeBase.length > 0 && i === lastUserMessageIndex) {
        const conversationHistory = messages.slice(0, i);
        const needsKB = await needsKnowledgeBase(message.text, conversationHistory);

        if (needsKB) {
          console.log(`[RAG] Knowledge base needed for message: "${message.text.substring(0, 50)}..."`);

          const selectedIds = await selectRelevantKnowledgeSources(
            message.text,
            settings.knowledgeBase
          );

          const relevantContent = settings.knowledgeBase
            .filter((kb, idx) => selectedIds.includes(idx.toString()))
            .map((kb) => {
              const fullContent = kb.content;
              const truncatedContent = fullContent.length > 5000
                ? fullContent.substring(0, 5000) + "..."
                : fullContent;

              let formattedContent = `--- KNOWLEDGE_SOURCE: ${kb.name} ---\n\n`;
              formattedContent += `--- TEXT_CONTENT ---\n${truncatedContent}\n`;

              if (kb.additionalData && Object.keys(kb.additionalData).length > 0) {
                formattedContent += `\n--- ADDITIONAL_DATA (JSON) ---\n`;
                Object.entries(kb.additionalData).forEach(([key, value]) => {
                  if (Array.isArray(value) && value.length > 0) {
                    formattedContent += `${key.toUpperCase()}:\n${JSON.stringify(value, null, 2)}\n\n`;
                  } else if (typeof value === "object" && value !== null) {
                    formattedContent += `${key.toUpperCase()}:\n${JSON.stringify(value, null, 2)}\n\n`;
                  }
                });
              }

              return formattedContent;
            })
            .join("\n\n");

          if (relevantContent) {
            const hasQnAData = settings.qnaData && settings.qnaData.length > 0;
            const instructionPrefix = hasQnAData
              ? `TÄRKEÄÄ: Käytä seuraavaa tietopankkia VAIN jos system instructionissa olevat Q&A-vastaukset eivät vastaa kysymykseeni. Jos Q&A-vastaukset sisältävät vastauksen, käytä niitä eikä tietopankkia.\n\n`
              : `Käytä seuraavaa tietopankkia vastataksesi kysymykseeni:\n\n`;

            userText = `${instructionPrefix}${relevantContent}\n\n--- USER_QUESTION ---\n${message.text}`;
          }
        } else {
          console.log(`[RAG] Knowledge base NOT needed for message: "${message.text.substring(0, 50)}..."`);
        }
      }

      contents.push({ role: "user", parts: [{ text: userText }] });
    } else if (message.sender === "bot" || message.sender === "agent") {
      if (message.text || !message.isStreaming) {
        contents.push({ role: "model", parts: [{ text: message.text }] });
      }
    }
  }

  return contents;
}

// Rakentaa system instruction
function buildSystemInstruction(settings: AppSettings): string {
  let instruction = `You are a helpful customer service chatbot for ${settings.appearance.brandName}.\n`;
  instruction += `Your tone should be: ${settings.personality.tone}.\n`;

  const botLanguage = settings.behavior.language || "fi";
  if (botLanguage === "en") {
    instruction += `Always respond in English. All your responses must be in English.\n`;
  } else {
    instruction += `Always respond in Finnish. All your responses must be in Finnish.\n`;
  }

  if (settings.behavior.askForName) {
    instruction += `Always ask for the customer's name at the start of the conversation.\n`;
  }

  if (settings.behavior.leadGenHook) {
    instruction += `Ask customer to leave their contact details when this hook is triggered: ${settings.behavior.leadGenHook}\n`;
  }

  instruction += `${settings.personality.customInstruction}\n\n`;

  const qnaData = settings.qnaData || [];
  if (qnaData.length > 0) {
    instruction += "Vastaa näihin kysymyksiin tarkasti seuraavasti:\n";
    qnaData.forEach((data) => {
      instruction += `Q: ${data.name}\nA: ${data.content}\n`;
    });
  }

  return instruction;
}

// Main chat streaming function
export const geminiChatStream = functions.https.onCall(
  async (data: { conversation: Conversation; settings: AppSettings }, context) => {
    try {
      const { conversation, settings } = data;
      const ai = getAiClient();
      const contents = await buildChatContents(conversation, settings);
      const systemInstruction = buildSystemInstruction(settings);

      // Vaihe A: Ensimmäinen kutsu Geminille työkalujen kanssa
      const initialResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: [getProductsTool] }],
        },
      });

      const functionCall = initialResponse.functionCalls?.[0];

      if (functionCall && functionCall.name === "getProducts") {
        const args = functionCall.args as { category?: string; searchTerm?: string };
        const apiResult = await getProductsFromApi(args.category, args.searchTerm);

        // Vaihe C: Lähetetään API:n tulos takaisin Geminille
        const finalResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            ...contents,
            {
              role: "model",
              parts: [{ functionCall: functionCall }],
            },
            {
              role: "user",
              parts: [{
                functionResponse: {
                  name: "getProducts",
                  response: { result: apiResult },
                },
              }],
            },
          ],
          config: {
            systemInstruction: systemInstruction,
          },
        });

        const finalText = finalResponse.text;
        if (!finalText) {
          throw new Error("Empty response from Gemini API");
        }

        return { text: finalText };
      } else {
        const initialText = initialResponse.text;
        if (!initialText) {
          throw new Error("Empty response from Gemini API");
        }

        return { text: initialText };
      }
    } catch (error: any) {
      console.error("Gemini API error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate chat response",
        error.message
      );
    }
  }
);

// Conversation summary function
export const geminiConversationSummary = functions.https.onCall(
  async (data: { conversation: Conversation }, context) => {
    try {
      const { conversation } = data;
      const ai = getAiClient();

      const conversationText = conversation.messages
        .filter((m) => m.sender !== "system")
        .map((m) => `${m.sender}: ${m.text}`)
        .join("\n");

      const prompt = `Provide a concise, one-paragraph summary of the following customer service chat conversation. The summary should be in Finnish.

Conversation:
${conversationText.substring(0, 15000)}

Summary:`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const resultText = result.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini API");
      }

      return { summary: resultText.trim() };
    } catch (error: any) {
      console.error("Error generating conversation summary:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate summary",
        error.message
      );
    }
  }
);

// Generate training data from text
export const geminiGenerateTrainingData = functions.https.onCall(
  async (data: { text: string; title: string }, context) => {
    try {
      const { text, title } = data;
      const ai = getAiClient();

      if (!text || text.trim().length === 0) {
        return { data: [] };
      }

      const textToUse = text.substring(0, 15000);
      console.log(`Using ${textToUse.length} characters for Q&A generation`);

      const prompt = `From the following text from the website "${title}", generate a list of 5-10 frequently asked questions and their corresponding answers. The questions should be things a customer would likely ask.

Text:
${textToUse}

Return the result as a JSON array of objects, where each object has a "question" and "answer" property.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "The customer's question." },
                answer: { type: Type.STRING, description: "The answer to the question." }
              },
              required: ["question", "answer"]
            }
          }
        }
      });

      const resultText = result.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini API");
      }

      const jsonStr = resultText.trim();
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        throw new Error("Generated data is not an array.");
      }

      const trainingData = parsed.map((item: any) => ({
        type: "qna",
        name: item.question,
        content: item.answer,
      }));

      return { data: trainingData };
    } catch (error: any) {
      console.error("Error generating training data:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate training data",
        error.message
      );
    }
  }
);

// Analyze conversations
export const geminiAnalyzeConversations = functions.https.onCall(
  async (data: { conversations: Conversation[] }, context) => {
    try {
      const { conversations } = data;
      const ai = getAiClient();

      const conversationData = conversations.map((c) => ({
        visitorName: c.visitorName,
        messages: c.messages.map((m) => `${m.sender}: ${m.text}`).join("\n"),
      }));

      let jsonString = "";
      try {
        jsonString = JSON.stringify(conversationData, null, 2);
      } catch (e) {
        console.error("Circular reference detected in conversation data analysis", e);
        jsonString = "Error: Could not serialize conversation data due to circular references.";
      }

      const prompt = `Analyze the following customer service chat conversations. Provide a concise summary, list the key feedback points from customers, and suggest 3 concrete improvements for the business based on the conversations.

Conversations:
${jsonString.substring(0, 15000)}

Return the result as a single JSON object.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A brief summary of all conversations." },
              keyFeedback: {
                type: Type.ARRAY,
                description: "A list of key feedback points or common issues.",
                items: { type: Type.STRING }
              },
              improvementSuggestions: {
                type: Type.ARRAY,
                description: "A list of actionable improvement suggestions for the business.",
                items: { type: Type.STRING }
              }
            },
            required: ["summary", "keyFeedback", "improvementSuggestions"]
          }
        }
      });

      const resultText = result.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini API");
      }

      const jsonStr = resultText.trim();
      const analysisResult: AnalysisResult = JSON.parse(jsonStr);

      return analysisResult;
    } catch (error: any) {
      console.error("Error analyzing conversations:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to analyze conversations",
        error.message
      );
    }
  }
);

// Translate text
export const geminiTranslateText = functions.https.onCall(
  async (data: { text: string; targetLanguage: "fi" | "en" }, context) => {
    try {
      const { text, targetLanguage } = data;
      const ai = getAiClient();

      const prompt = targetLanguage === "en"
        ? `Translate the following Finnish text to English. Only return the translation, nothing else:\n\n${text}`
        : `Translate the following English text to Finnish. Only return the translation, nothing else:\n\n${text}`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const resultText = result.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini API");
      }

      return { translatedText: resultText.trim() };
    } catch (error: any) {
      console.error("Error translating text:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to translate text",
        error.message
      );
    }
  }
);

