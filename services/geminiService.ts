
// services/geminiService.ts

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppSettings, Conversation, KnowledgeSource, AnalysisResult } from '../types.ts';


const getAiClient = () => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set!");
        throw new Error("Gemini API key is not configured.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 1. Määritellään getProducts-funktion kuvaus Geminille
const getProductsTool: FunctionDeclaration = {
  name: 'getProducts',
  description: 'Hae tuotetietoja tuotekatalogista. Voit suodattaa tuotteita kategorian tai hakusanan perusteella.',
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
    // Gemini voi jättää parametrit pois, jos niitä ei ole mainittu
    required: [], 
  },
};


// 2. Tämä on funktio, joka kutsuisi oikeaa rajapintaasi.
// Toistaiseksi se palauttaa simuloitua dataa.
async function getProductsFromApi(category?: string, searchTerm?: string) {
    try {
        console.log(`Haetaan tuotteita... Kategoria: ${category}, Hakusana: ${searchTerm}`);
        
        // TÄMÄ ON KOHTA, JOKA MUUTETAAN MYÖHEMMIN
        // Kommentoi alla oleva pois ja ota oikea fetch-kutsu käyttöön, kun rajapinta on valmis.
        /*
        const response = await fetch(`https://sinun-api.com/getProducts?category=${category || ''}&search=${searchTerm || ''}`);
        if (!response.ok) {
            throw new Error('API call failed');
        }
        const data = await response.json();
        return data;
        */

        // Simuloitu API-vastaus
        const mockApiResponse = [
            { id: 'TV001', name: 'Samsung 55" 4K Smart OLED TV', price: '1299€', stock: 15, description: 'Upea kuvanlaatu ja ohuet reunat.' },
            { id: 'TV002', name: 'LG 65" QNED MiniLED TV', price: '1899€', stock: 8, description: 'Kirkas kuva ja erinomainen kontrasti.' },
            { id: 'TV003', name: 'Sony 50" Bravia Full HD', price: '799€', stock: 22, description: 'Luotettava perustelevisio hyvällä kuvalla.' },
        ];

        return mockApiResponse;

    } catch (error) {
        console.error("API call to getProducts failed:", error);
        return { error: "Tuotteiden haku epäonnistui." };
    }
}


const buildChatContents = (conversation: Conversation, settings: AppSettings) => {
    const contents: { role: 'user' | 'model', parts: ({ text: string } | { functionCall: any } | { functionResponse: any })[] }[] = [];

    settings.personality.scenarios.forEach(scenario => {
        contents.push({ role: 'user', parts: [{ text: scenario.userMessage }] });
        contents.push({ role: 'model', parts: [{ text: scenario.botResponse }] });
    });
    
    const messages = conversation.messages;
    const firstUserMessageIndex = messages.findIndex(m => m.sender === 'user');

    messages.forEach((message, index) => {
        if (message.sender === 'user') {
            let userText = message.text;
            // Prepend the general knowledge base only to the FIRST user message of the conversation for efficiency.
            if (index === firstUserMessageIndex) { 
                const knowledgeBaseContent = settings.knowledgeBase
                    ?.map(d => `--- TIETOPANKKI: ${d.name} ---\n${d.content}`)
                    .join('\n\n');
                
                if (knowledgeBaseContent) {
                    userText = `Käytä seuraavaa tietopankkia vastataksesi kysymykseeni:\n\n${knowledgeBaseContent}\n\n--- KYSYMYKSENI ---\n${message.text}`;
                }
            }
            contents.push({ role: 'user', parts: [{ text: userText }] });

        } else if (message.sender === 'bot' || message.sender === 'agent') {
            if (message.text || !message.isStreaming) {
                contents.push({ role: 'model', parts: [{ text: message.text }] });
            }
        }
    });
    
    return contents;
};

const buildSystemInstructionForChat = (settings: AppSettings): string => {
    let instruction = `You are a helpful customer service chatbot for ${settings.appearance.brandName}.\n`;
    instruction += `Your tone should be: ${settings.personality.tone}.\n`;

    const botLanguage = settings.behavior.language || 'fi';
    if (botLanguage === 'en') {
        instruction += `Always respond in English. All your responses must be in English.\n`;
    } else {
        instruction += `Always respond in Finnish. All your responses must be in Finnish.\n`;
    }

    if(settings.behavior.askForName){
        instruction += `Always ask for the customer's name at the start of the conversation.\n`;
    }

    if(settings.behavior.leadGenHook){
        instruction += `Ask customer to leave their contact details when this hook is triggered: ${settings.behavior.leadGenHook}\n`;
    }


    instruction += `${settings.personality.customInstruction}\n\n`;

    // Only include the specific Q&A data in the system instruction.
    const qnaData = settings.qnaData || [];
    if (qnaData.length > 0) {
        instruction += "Vastaa näihin kysymyksiin tarkasti seuraavasti:\n";
        qnaData.forEach(data => {
            instruction += `Q: ${data.name}\nA: ${data.content}\n`;
        });
    }
    return instruction;
};

export async function* getChatResponseStream(
    conversation: Conversation,
    settings: AppSettings
): AsyncGenerator<string> {
    try {
        const ai = getAiClient();
        const contents = buildChatContents(conversation, settings);
        const systemInstruction = buildSystemInstructionForChat(settings);

        // Vaihe A: Ensimmäinen, ei-striimaava kutsu Geminille työkalujen kanssa
        const initialResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: [getProductsTool] }], // Kerrotaan Geminille työkalusta
            },
        });

        const functionCall = initialResponse.functionCalls?.[0];

        // Vaihe B: Tarkistetaan, pyysikö Gemini funktiokutsua
        if (functionCall && functionCall.name === 'getProducts') {
            const args = functionCall.args as { category?: string, searchTerm?: string };
            
            // Suoritetaan oma (simuloitu) API-kutsufunktio
            const apiResult = await getProductsFromApi(args.category, args.searchTerm);

            // Vaihe C: Lähetetään API:n tulos takaisin Geminille ja pyydetään lopullista vastausta striimattuna
            const finalResponseStream = await ai.models.generateContentStream({
                model: "gemini-2.5-flash",
                contents: [
                    ...contents,
                    {
                        role: 'model',
                        parts: [{ functionCall: functionCall }]
                    },
                    {
                        role: 'user', // "user" rooli, koska se edustaa työkalun palauttamaa dataa
                        parts: [{
                            functionResponse: {
                                name: 'getProducts',
                                response: { result: apiResult },
                            }
                        }]
                    }
                ],
                config: {
                    systemInstruction: systemInstruction,
                },
            });

            // Striimataan lopullinen, muotoiltu vastaus käyttäjälle
            for await (const chunk of finalResponseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    yield chunkText;
                }
            }
        } else {
            // Ei funktiokutsua, palautetaan normaali tekstivastaus.
            const text = initialResponse.text;
            if (text) {
                yield text;
            }
        }
    } catch (error) {
        console.error("Gemini API error in getChatResponseStream:", error);
        yield "Pahoittelut, tekoälyyn ei saatu yhteyttä. Yritä myöhemmin uudelleen.";
    }
}


// FIX: Added the missing getConversationSummary function.
export const getConversationSummary = async (conversation: Conversation): Promise<string> => {
    try {
        const ai = getAiClient();
        
        const conversationText = conversation.messages
            .filter(m => m.sender !== 'system')
            .map(m => `${m.sender}: ${m.text}`).join('\n');

        const prompt = `Provide a concise, one-paragraph summary of the following customer service chat conversation. The summary should be in Finnish.

    Conversation:
    ${conversationText.substring(0, 15000)}
    
    Summary:`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
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
        
        const ai = getAiClient();
        
        // Use first 15000 characters to avoid token limits
        const textToUse = text.substring(0, 15000);
        console.log(`Using ${textToUse.length} characters for Q&A generation`);
        
        const prompt = `From the following text from the website "${title}", generate a list of 5-10 frequently asked questions and their corresponding answers. The questions should be things a customer would likely ask.

    Text:
    ${textToUse}

    Return the result as a JSON array of objects, where each object has a "question" and "answer" property.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                        required: ['question', 'answer']
                    }
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);

        if (!Array.isArray(parsed)) {
            throw new Error("Generated data is not an array.");
        }
        
        return parsed.map((item: any) => ({
            type: 'qna',
            name: item.question,
            content: item.answer,
        }));
    } catch (error) {
        console.error("Error generating training data:", error);
        return [];
    }
};

export const analyzeConversations = async (conversations: Conversation[]): Promise<AnalysisResult> => {
    try {
        const ai = getAiClient();
        
        const conversationData = conversations.map(c => ({
            visitorName: c.visitorName,
            messages: c.messages.map(m => `${m.sender}: ${m.text}`).join('\n')
        }));

        // Prevent circular reference errors during analysis stringification
        let jsonString = '';
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
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
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
                    required: ['summary', 'keyFeedback', 'improvementSuggestions']
                }
            }
        });

        const jsonStr = response.text.trim();
        const result: AnalysisResult = JSON.parse(jsonStr);
        return result;
    } catch (error) {
        console.error("Error analyzing conversations:", error);
        throw new Error("Failed to analyze conversations. The AI model might be temporarily unavailable.");
    }
};

export const translateText = async (text: string, targetLanguage: 'fi' | 'en'): Promise<string> => {
    try {
        const ai = getAiClient();
        
        const prompt = targetLanguage === 'en' 
            ? `Translate the following Finnish text to English. Only return the translation, nothing else:\n\n${text}`
            : `Translate the following English text to Finnish. Only return the translation, nothing else:\n\n${text}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error translating text:", error);
        return text; // Return original text if translation fails
    }
};
