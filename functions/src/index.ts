import * as functions from "firebase-functions";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import * as admin from "firebase-admin";
import {
  Conversation,
  Message,
  AppSettings,
  KnowledgeSource,
  AnalysisResult,
} from "./types";
import { config } from "./config";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

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
  description: config.tools.getProducts.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: config.tools.getProducts.parameters.category,
      },
      searchTerm: {
        type: Type.STRING,
        description: config.tools.getProducts.parameters.searchTerm,
      },
    },
    required: [],
  },
};

// Submit Contact Form Tool
const submitContactFormTool: FunctionDeclaration = {
  name: "submitContactForm",
  description: config.tools.submitContactForm.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: config.tools.submitContactForm.parameters.name,
      },
      email: {
        type: Type.STRING,
        description: config.tools.submitContactForm.parameters.email,
      },
      message: {
        type: Type.STRING,
        description: config.tools.submitContactForm.parameters.message,
      },
    },
    required: ["name", "email", "message"],
  },
};

// Submit Quote Request Tool
const submitQuoteFormTool: FunctionDeclaration = {
  name: "submitQuoteRequest",
  description: config.tools.submitQuoteRequest.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.name,
      },
      email: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.email,
      },
      company: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.company,
      },
      details: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.details,
      },
    },
    required: ["name", "email", "details"],
  },
};

// Search Knowledge Base Tool
const searchKnowledgeBaseTool: FunctionDeclaration = {
  name: "searchKnowledgeBase",
  description: config.tools.searchKnowledgeBase.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: config.tools.searchKnowledgeBase.parameters.query,
      },
      maxResults: {
        type: Type.NUMBER,
        description: config.tools.searchKnowledgeBase.parameters.maxResults,
      },
    },
    required: ["query"],
  },
};


// Mock products API (same as client-side)
async function getProductsFromApi(category?: string, searchTerm?: string) {
  try {
    console.log(`Haetaan tuotteita... Kategoria: ${category}, Hakusana: ${searchTerm}`);
    
    // Simuloitu API-vastaus
    const mockApiResponse = config.mockData.products;

    return mockApiResponse;
  } catch (error) {
    console.error("API call to getProducts failed:", error);
    return { error: config.messages.products.error };
  }
}

// Submit Contact Form
async function submitContactForm(
  conversationId: string,
  botId: string,
  visitorId: string,
  visitorName: string,
  data: { name: string; email: string; message: string }
) {
  console.log(`[FORM] submitContactForm called with:`, {
    conversationId,
    botId,
    visitorId,
    visitorName,
    formData: { name: data.name, email: data.email, messageLength: data.message?.length || 0 }
  });

  try {
    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      botId,
      conversationId,
      visitorId,
      visitorName: data.name || visitorName,
      type: "contact",
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
      },
      createdAt: new Date().toISOString(),
      isHandled: false,
    };

    console.log(`[FORM] Created submission object:`, {
      id: submission.id,
      type: submission.type,
      visitorName: submission.visitorName
    });

    const convRef = db.collection("conversations").doc(conversationId);
    console.log(`[FORM] Checking if conversation document exists: ${conversationId}`);
    
    // Tarkista onko dokumentti olemassa
    const docSnapshot = await convRef.get();
    console.log(`[FORM] Document exists: ${docSnapshot.exists}`);
    
    if (!docSnapshot.exists) {
      // Jos dokumentti ei ole olemassa, luo se ensin
      console.log(`[FORM] Document does not exist, creating new conversation document`);
      await convRef.set({
        botId,
        visitorId,
        visitorName: data.name || visitorName,
        messages: [],
        submissions: [submission],
        isRead: false,
        isEnded: false,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[FORM] Successfully created new conversation document with submission`);
    } else {
      // Jos dokumentti on olemassa, päivitä se
      console.log(`[FORM] Document exists, updating with arrayUnion`);
      await convRef.update({
        submissions: admin.firestore.FieldValue.arrayUnion(submission),
      });
      console.log(`[FORM] Successfully updated conversation document with submission`);
    }

    const result = {
      success: true,
      message: config.messages.contactForm.success,
    };
    console.log(`[FORM] Contact form submitted successfully for conversation ${conversationId}`, result);
    return result;
  } catch (error: any) {
    console.error("[FORM] Error submitting contact form:", error);
    console.error("[FORM] Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return {
      success: false,
      error: config.messages.contactForm.error,
    };
  }
}

// Submit Quote Request
async function submitQuoteRequest(
  conversationId: string,
  botId: string,
  visitorId: string,
  visitorName: string,
  data: { name: string; email: string; company?: string; details: string }
) {
  console.log(`[FORM] submitQuoteRequest called with:`, {
    conversationId,
    botId,
    visitorId,
    visitorName,
    formData: { name: data.name, email: data.email, company: data.company, detailsLength: data.details?.length || 0 }
  });

  try {
    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      botId,
      conversationId,
      visitorId,
      visitorName: data.name || visitorName,
      type: "quote",
      data: {
        name: data.name,
        email: data.email,
        company: data.company || "",
        details: data.details,
      },
      createdAt: new Date().toISOString(),
      isHandled: false,
    };

    console.log(`[FORM] Created quote submission object:`, {
      id: submission.id,
      type: submission.type,
      visitorName: submission.visitorName
    });

    const convRef = db.collection("conversations").doc(conversationId);
    console.log(`[FORM] Checking if conversation document exists: ${conversationId}`);
    
    // Tarkista onko dokumentti olemassa
    const docSnapshot = await convRef.get();
    console.log(`[FORM] Document exists: ${docSnapshot.exists}`);
    
    if (!docSnapshot.exists) {
      // Jos dokumentti ei ole olemassa, luo se ensin
      console.log(`[FORM] Document does not exist, creating new conversation document`);
      await convRef.set({
        botId,
        visitorId,
        visitorName: data.name || visitorName,
        messages: [],
        submissions: [submission],
        isRead: false,
        isEnded: false,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[FORM] Successfully created new conversation document with quote submission`);
    } else {
      // Jos dokumentti on olemassa, päivitä se
      console.log(`[FORM] Document exists, updating with arrayUnion`);
      await convRef.update({
        submissions: admin.firestore.FieldValue.arrayUnion(submission),
      });
      console.log(`[FORM] Successfully updated conversation document with quote submission`);
    }

    const result = {
      success: true,
      message: config.messages.quoteRequest.success,
    };
    console.log(`[FORM] Quote request submitted successfully for conversation ${conversationId}`, result);
    return result;
  } catch (error: any) {
    console.error("[FORM] Error submitting quote request:", error);
    console.error("[FORM] Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return {
      success: false,
      error: config.messages.quoteRequest.error,
    };
  }
}

// Search Knowledge Base
async function searchKnowledgeBase(
  settings: AppSettings,
  query: string,
  maxResults: number = 5
) {
  try {
    if (!settings.knowledgeBase || settings.knowledgeBase.length === 0) {
      return {
        success: false,
        message: config.messages.knowledgeBase.empty,
        results: [],
      };
    }

    // Limit maxResults to 1-10
    const limit = Math.min(Math.max(1, maxResults || 5), 10);

    // Use existing function to select relevant sources
    const selectedIds = await selectRelevantKnowledgeSources(query, settings.knowledgeBase);
    
    // Limit to requested number of results
    const limitedIds = selectedIds.slice(0, limit);

    // Käytä optimointiasetuksia
    const maxCharsPerSource = config.optimization.maxCharactersPerKnowledgeSource;
    
    const results = settings.knowledgeBase
      .filter((kb, idx) => limitedIds.includes(idx.toString()))
      .map((kb) => {
        const truncatedContent = kb.content.length > maxCharsPerSource
          ? kb.content.substring(0, maxCharsPerSource) + "..."
          : kb.content;

        return {
          name: kb.name,
          type: kb.type,
          content: truncatedContent,
          fullLength: kb.content.length,
        };
      });

    return {
      success: true,
      results,
      count: results.length,
    };
  } catch (error: any) {
    console.error("Error searching knowledge base:", error);
    return {
      success: false,
      error: config.messages.knowledgeBase.error,
      results: [],
    };
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
    
    const analysisPrompt = config.rag.needsKnowledgeBase.prompt(conversationContext, userQuestion);

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
              description: config.rag.needsKnowledgeBase.responseSchema.needsKnowledgeBase
            },
            reason: {
              type: Type.STRING,
              description: config.rag.needsKnowledgeBase.responseSchema.reason
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
  const maxSources = config.optimization.maxKnowledgeSourcesPerMessage;
  
  try {
    const ai = getAiClient();
    
    if (knowledgeBase.length <= maxSources) {
      console.log(`[RAG] Small knowledge base (${knowledgeBase.length} items), using all`);
      return knowledgeBase.map((_, idx) => idx.toString());
    }
    
    const knowledgeSourceMetadata = knowledgeBase.map((kb, index) => ({
      id: index.toString(),
      name: kb.name,
      type: kb.type,
      preview: kb.content.substring(0, 300),
    }));
    
    const knowledgeSourceMetadataStr = knowledgeSourceMetadata.map((kb) =>
      `[${kb.id}] ${kb.name} (${kb.type})\nEsikatselu: ${kb.preview}...`
    ).join("\n\n");
    const selectionPrompt = config.rag.selectRelevantSources.prompt(userQuestion, knowledgeSourceMetadataStr, maxSources);

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
              description: config.rag.selectRelevantSources.responseSchema.selectedIds
            }
          },
          required: ["selectedIds"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      console.error("Empty response from Gemini API");
      return knowledgeBase.slice(0, maxSources).map((_, idx) => idx.toString());
    }

    const result = JSON.parse(responseText);
    const selectedIds = result.selectedIds || [];
    
    const validIds = selectedIds.filter((id: string) => {
      const idx = parseInt(id);
      return !isNaN(idx) && idx >= 0 && idx < knowledgeBase.length;
    });
    
    const finalIds = validIds.length > 0
      ? validIds.slice(0, maxSources)
      : knowledgeBase.slice(0, maxSources).map((_, idx) => idx.toString());
    
    console.log(`[RAG] Selected ${finalIds.length} relevant knowledge sources: ${finalIds.join(", ")}`);
    return finalIds;
  } catch (error) {
    console.error("Error selecting relevant knowledge sources:", error);
    return knowledgeBase.slice(0, maxSources).map((_, idx) => idx.toString());
  }
}

// Rakentaa keskustelun sisällön käyttäen knowledge base -tietoja
async function buildChatContents(
  conversation: Conversation,
  settings: AppSettings
): Promise<Array<{ role: "user" | "model"; parts: Array<{ text: string } | { functionCall?: any } | { functionResponse?: any }> }>> {
  const contents: Array<{ role: "user" | "model"; parts: Array<any> }> = [];

  // Lisätään skenaariot (rajoitettu määrä)
  const maxScenarios = config.optimization.maxScenarios;
  const limitedScenarios = settings.personality.scenarios.slice(0, maxScenarios);
  limitedScenarios.forEach((scenario) => {
    contents.push({ role: "user", parts: [{ text: scenario.userMessage }] });
    contents.push({ role: "model", parts: [{ text: scenario.botResponse }] });
  });

  const messages = conversation.messages;
  
  // Rajoita viestit viimeisiin N viestiin (uusimmat viestit)
  const maxMessages = config.optimization.maxMessagesInHistory;
  const recentMessages = messages.length > maxMessages 
    ? messages.slice(-maxMessages)
    : messages;
  
  // Etsi viimeinen käyttäjäviesti rajoitetusta listasta
  let lastUserMessageIndex = -1;
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    if (recentMessages[i].sender === "user") {
      lastUserMessageIndex = i;
      break;
    }
  }

  for (let i = 0; i < recentMessages.length; i++) {
    const message = recentMessages[i];

    if (message.sender === "user") {
      let userText = message.text;

      if (settings.knowledgeBase && settings.knowledgeBase.length > 0 && i === lastUserMessageIndex) {
        const conversationHistory = recentMessages.slice(0, i);
        const needsKB = await needsKnowledgeBase(message.text, conversationHistory);

        if (needsKB) {
          console.log(`[RAG] Knowledge base needed for message: "${message.text.substring(0, 50)}..."`);

          const selectedIds = await selectRelevantKnowledgeSources(
            message.text,
            settings.knowledgeBase
          );

          // Rajoita valittujen knowledge sourciden määrää
          const maxSources = config.optimization.maxKnowledgeSourcesPerMessage;
          const limitedIds = selectedIds.slice(0, maxSources);
          const maxCharsPerSource = config.optimization.maxCharactersPerKnowledgeSource;

          const relevantContent = settings.knowledgeBase
            .filter((kb, idx) => limitedIds.includes(idx.toString()))
            .map((kb) => {
              const fullContent = kb.content;
              const truncatedContent = fullContent.length > maxCharsPerSource
                ? fullContent.substring(0, maxCharsPerSource) + "..."
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
  let instruction = config.systemInstructions.base.intro(settings.appearance.brandName);
  instruction += config.systemInstructions.base.tone(settings.personality.tone);

  const botLanguage = settings.behavior.language || "fi";
  instruction += config.systemInstructions.base.language[botLanguage];

  if (settings.behavior.askForName) {
    instruction += config.systemInstructions.base.askForName;
  }

  // Parannettu työkaluohjeistus
  instruction += config.systemInstructions.tools.header;
  instruction += config.systemInstructions.tools.intro;
  
  instruction += config.systemInstructions.tools.contactForm.header;
  if (settings.behavior.contactRule && settings.behavior.contactRule.trim()) {
    // Käytä käyttäjän määrittelemää sääntöä
    instruction += `   ${settings.behavior.contactRule}\n`;
  } else {
    // Oletussääntö
    config.systemInstructions.tools.contactForm.defaultRules.forEach(rule => {
      instruction += `   ${rule}\n`;
    });
  }
  instruction += config.systemInstructions.tools.contactForm.important;
  
  instruction += config.systemInstructions.tools.quoteRequest.header;
  if (settings.behavior.leadGenHook && settings.behavior.leadGenHook.trim()) {
    // Käytä käyttäjän määrittelemää sääntöä
    instruction += `   ${settings.behavior.leadGenHook}\n`;
  } else {
    // Oletussääntö
    config.systemInstructions.tools.quoteRequest.defaultRules.forEach(rule => {
      instruction += `   ${rule}\n`;
    });
  }
  instruction += config.systemInstructions.tools.quoteRequest.important;
  
  instruction += config.systemInstructions.tools.getProducts;
  instruction += config.systemInstructions.tools.searchKnowledgeBase;
  
  instruction += config.systemInstructions.tools.usageGuidelines.header;
  config.systemInstructions.tools.usageGuidelines.rules.forEach(rule => {
    instruction += `${rule}\n`;
  });
  instruction += `\n`;

  instruction += `${settings.personality.customInstruction}\n\n`;

  const qnaData = settings.qnaData || [];
  if (qnaData.length > 0) {
    instruction += config.systemInstructions.qna.header;
    qnaData.forEach((data) => {
      instruction += config.systemInstructions.qna.format(data.name, data.content);
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
      const allTools = [
        getProductsTool,
        submitContactFormTool,
        submitQuoteFormTool,
        searchKnowledgeBaseTool,
      ];

      const initialResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: allTools }],
        },
      });

      const functionCalls = initialResponse.functionCalls || [];
      console.log(`[DEBUG] Function calls received: ${JSON.stringify(functionCalls)}`);
      console.log(`[FORM] Checking for form-related function calls...`);
      const formCalls = functionCalls.filter(fc => fc.name === "submitContactForm" || fc.name === "submitQuoteRequest");
      if (formCalls.length > 0) {
        console.log(`[FORM] Found ${formCalls.length} form-related function call(s):`, formCalls.map(fc => ({ name: fc.name, args: fc.args })));
      }
      
      // If there are function calls, process them
      if (functionCalls.length > 0) {
        console.log(`[DEBUG] Processing ${functionCalls.length} function call(s)`);
        const functionResponses: any[] = [];
        let updatedContents = [...contents];

        // Process each function call
        for (const functionCall of functionCalls) {
          let functionResult: any;

          if (functionCall.name === "getProducts") {
            const args = functionCall.args as { category?: string; searchTerm?: string };
            functionResult = await getProductsFromApi(args.category, args.searchTerm);
            functionResponses.push({
              name: "getProducts",
              response: { result: functionResult },
            });
          } else if (functionCall.name === "submitContactForm") {
            const args = functionCall.args as { name: string; email: string; message: string };
            console.log(`[FORM] Processing submitContactForm function call:`, {
              conversationId: conversation.id,
              args: { name: args.name, email: args.email, messageLength: args.message?.length || 0 }
            });
            functionResult = await submitContactForm(
              conversation.id,
              conversation.botId,
              conversation.visitorId,
              conversation.visitorName,
              args
            );
            console.log(`[FORM] submitContactForm result:`, functionResult);
            functionResponses.push({
              name: "submitContactForm",
              response: functionResult,
            });
            console.log(`[FORM] Added submitContactForm response to functionResponses array`);
          } else if (functionCall.name === "submitQuoteRequest") {
            const args = functionCall.args as { name: string; email: string; company?: string; details: string };
            console.log(`[FORM] Processing submitQuoteRequest function call:`, {
              conversationId: conversation.id,
              args: { name: args.name, email: args.email, company: args.company, detailsLength: args.details?.length || 0 }
            });
            functionResult = await submitQuoteRequest(
              conversation.id,
              conversation.botId,
              conversation.visitorId,
              conversation.visitorName,
              args
            );
            console.log(`[FORM] submitQuoteRequest result:`, functionResult);
            functionResponses.push({
              name: "submitQuoteRequest",
              response: functionResult,
            });
            console.log(`[FORM] Added submitQuoteRequest response to functionResponses array`);
          } else if (functionCall.name === "searchKnowledgeBase") {
            const args = functionCall.args as { query: string; maxResults?: number };
            functionResult = await searchKnowledgeBase(settings, args.query, args.maxResults);
            functionResponses.push({
              name: "searchKnowledgeBase",
              response: functionResult,
            });
          }

          // Add function call to contents
          updatedContents.push({
            role: "model",
            parts: [{ functionCall: functionCall }],
          });
        }

        // Add all function responses to contents
        console.log(`[FORM] Preparing to send function responses back to Gemini API`);
        console.log(`[FORM] Function responses count: ${functionResponses.length}`);
        functionResponses.forEach((fr, index) => {
          console.log(`[FORM] Function response ${index + 1}:`, {
            name: fr.name,
            success: fr.response?.success,
            message: fr.response?.message,
            error: fr.response?.error
          });
        });

        updatedContents.push({
          role: "user",
          parts: functionResponses.map((fr) => ({
            functionResponse: fr,
          })),
        });

        console.log(`[FORM] Sending function responses to Gemini API for final response`);
        // Vaihe C: Lähetetään työkalujen tulokset takaisin Geminille
        const finalResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: updatedContents,
          config: {
            systemInstruction: systemInstruction,
            tools: [{ functionDeclarations: allTools }],
          },
        });

        console.log(`[FORM] Received final response from Gemini API`);
        const finalText = finalResponse.text;
        console.log(`[FORM] Final response text length: ${finalText?.length || 0}`);
        console.log(`[FORM] Final response text preview: ${finalText?.substring(0, 200) || '(empty)'}`);
        
        if (!finalText) {
          console.error(`[FORM] ERROR: Empty response from Gemini API after function call`);
          console.error(`[FORM] Function calls that were processed:`, functionCalls.map(fc => ({ name: fc.name, args: fc.args })));
          console.error(`[FORM] Function responses that were sent:`, functionResponses);
          throw new Error("Empty response from Gemini API");
        }

        console.log(`[FORM] Successfully returning final response to client`);
        return { 
          text: finalText
        };
      } else {
        // No function calls, return initial response
        const initialText = initialResponse.text;
        console.log(`[DEBUG] No function calls - bot responded with text only`);
        console.log(`[DEBUG] Response text: ${initialText?.substring(0, 200)}`);
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

      const prompt = config.analysis.conversationSummary.prompt(conversationText);

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

      const prompt = config.analysis.trainingData.prompt(textToUse, title);

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
                question: { type: Type.STRING, description: config.analysis.trainingData.responseSchema.question },
                answer: { type: Type.STRING, description: config.analysis.trainingData.responseSchema.answer }
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

      const prompt = config.analysis.conversations.prompt(jsonString);

      const result = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: config.analysis.conversations.responseSchema.summary },
              keyFeedback: {
                type: Type.ARRAY,
                description: config.analysis.conversations.responseSchema.keyFeedback,
                items: { type: Type.STRING }
              },
              improvementSuggestions: {
                type: Type.ARRAY,
                description: config.analysis.conversations.responseSchema.improvementSuggestions,
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
        ? config.translation.fiToEn(text)
        : config.translation.enToFi(text);

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

// Create User Function
// Vain admin/superadmin käyttäjät voivat luoda uusia käyttäjiä
export const createUser = functions.https.onCall(
  async (data: { email: string; password: string; role: 'superadmin' | 'admin' | 'agent' | 'viewer'; name?: string }, context) => {
    // Tarkista että käyttäjä on autentikoitu
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Tarkista että kutsuva käyttäjä on admin tai superadmin
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Caller user not found in database');
    }

    const callerData = callerDoc.data();
    const callerRole = callerData?.role;

    if (callerRole !== 'admin' && callerRole !== 'superadmin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can create users');
    }

    // Tarkista että superadmin-roolia voi luoda vain superadmin
    if (data.role === 'superadmin' && callerRole !== 'superadmin') {
      throw new functions.https.HttpsError('permission-denied', 'Only superadmins can create superadmin users');
    }

    // Validoi salasana
    if (!data.password || data.password.length < 6) {
      throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters long');
    }

    // Validoi sähköposti
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
    }

    try {
      // Luo käyttäjä Firebase Authiin
      const userRecord = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.name || data.email.split('@')[0],
        emailVerified: false,
      });

      // Luo käyttäjädokumentti Firestoreen
      await db.collection('users').doc(userRecord.uid).set({
        email: data.email,
        role: data.role,
        name: data.name || data.email.split('@')[0],
        allowedBotIds: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[CREATE_USER] User created successfully: ${data.email} (${data.role}) by ${callerData?.email}`);

      return {
        success: true,
        uid: userRecord.uid,
        email: data.email,
        role: data.role,
        name: data.name || data.email.split('@')[0],
      };
    } catch (error: any) {
      console.error('[CREATE_USER] Error creating user:', error);
      
      // Jos käyttäjä on jo olemassa, palauta selkeä virheilmoitus
      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'User with this email already exists');
      }
      
      throw new functions.https.HttpsError('internal', error.message || 'Failed to create user');
    }
  }
);

