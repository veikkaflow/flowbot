import { GoogleGenAI } from "@google/genai";
import * as functions from "firebase-functions";
import { Conversation, Message, AppSettings } from "../types";
import { config } from "../config";
import { logger } from "../utils/logger";

// Gemini API -avain Firebase Functions -ympäristömuuttujasta
const GEMINI_API_KEY = functions.config().gemini?.api_key;

if (!GEMINI_API_KEY) {
  logger.error("GEMINI_API_KEY not configured in Firebase Functions config");
  logger.error("Set it with: firebase functions:config:set gemini.api_key=\"YOUR_KEY\"");
}

const genAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Helper function to get AI client
export function getAiClient(): GoogleGenAI {
  if (!genAI) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API key is not configured. Please set it using: firebase functions:config:set gemini.api_key=\"YOUR_KEY\""
    );
  }
  return genAI;
}

// Rakentaa keskustelun sisällön käyttäen knowledge base -tietoja
export async function buildChatContents(
  conversation: Conversation,
  settings: AppSettings,
  maxMessagesOverride?: number,
  needsKnowledgeBaseFn?: (userQuestion: string, conversationHistory: Message[]) => Promise<boolean>,
  selectRelevantKnowledgeSourcesFn?: (userQuestion: string, knowledgeBase: any[]) => Promise<string[]>
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
  const maxMessages = maxMessagesOverride !== undefined ? maxMessagesOverride : config.optimization.maxMessagesInHistory;
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

      if (settings.knowledgeBase && settings.knowledgeBase.length > 0 && i === lastUserMessageIndex && needsKnowledgeBaseFn && selectRelevantKnowledgeSourcesFn) {
        const conversationHistory = recentMessages.slice(0, i);
        const needsKB = await needsKnowledgeBaseFn(message.text, conversationHistory);

        if (needsKB) {
          logger.info(`Knowledge base needed for message: "${message.text.substring(0, 50)}..."`);

          const selectedIds = await selectRelevantKnowledgeSourcesFn(
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

              // Rajoita additionalData kokoa
              if (kb.additionalData && Object.keys(kb.additionalData).length > 0) {
                const maxAdditionalDataChars = 1000; // Rajoita additionalData kokoon
                let additionalDataStr = '';
                Object.entries(kb.additionalData).forEach(([key, value]) => {
                  if (additionalDataStr.length >= maxAdditionalDataChars) {
                    return; // Lopeta jos raja ylittyy
                  }
                  
                  if (Array.isArray(value) && value.length > 0) {
                    const jsonStr = JSON.stringify(value, null, 2);
                    if (additionalDataStr.length + jsonStr.length < maxAdditionalDataChars) {
                      additionalDataStr += `${key.toUpperCase()}:\n${jsonStr}\n\n`;
                    }
                  } else if (typeof value === "object" && value !== null) {
                    const jsonStr = JSON.stringify(value, null, 2);
                    if (additionalDataStr.length + jsonStr.length < maxAdditionalDataChars) {
                      additionalDataStr += `${key.toUpperCase()}:\n${jsonStr}\n\n`;
                    }
                  }
                });
                
                if (additionalDataStr) {
                  // Truncate jos yhä liian pitkä
                  if (additionalDataStr.length > maxAdditionalDataChars) {
                    additionalDataStr = additionalDataStr.substring(0, maxAdditionalDataChars) + "...";
                  }
                  formattedContent += `\n--- ADDITIONAL_DATA (JSON) ---\n${additionalDataStr}`;
                }
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
          logger.info(`Knowledge base NOT needed for message: "${message.text.substring(0, 50)}..."`);
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
export function buildSystemInstruction(settings: AppSettings): string {
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

  // Rich Content instructions
  if (settings.behavior.richContentEnabled) {
    instruction += config.systemInstructions.tools.richContent.header;
    instruction += config.systemInstructions.tools.richContent.description;
    instruction += config.systemInstructions.tools.richContent.personCard.header;
    config.systemInstructions.tools.richContent.personCard.rules.forEach(rule => {
      instruction += `   ${rule}\n`;
    });
    instruction += config.systemInstructions.tools.richContent.personCard.format;
    instruction += config.systemInstructions.tools.richContent.productCard.header;
    config.systemInstructions.tools.richContent.productCard.rules.forEach(rule => {
      instruction += `   ${rule}\n`;
    });
    instruction += config.systemInstructions.tools.richContent.productCard.format;
    instruction += config.systemInstructions.tools.richContent.important;
  }

  // Truncate custom instruction
  const maxCustomInstructionChars = config.optimization.maxCharactersInCustomInstruction;
  const customInstruction = settings.personality.customInstruction || '';
  const truncatedCustomInstruction = customInstruction.length > maxCustomInstructionChars
    ? customInstruction.substring(0, maxCustomInstructionChars) + "..."
    : customInstruction;
  instruction += `${truncatedCustomInstruction}\n\n`;

  // Rajoita Q&A-dataa
  const qnaData = settings.qnaData || [];
  if (qnaData.length > 0) {
    instruction += config.systemInstructions.qna.header;
    const maxQnAPairs = config.optimization.maxQnAPairs;
    const maxQnAAnswerChars = config.optimization.maxCharactersPerQnAAnswer;
    const limitedQnA = qnaData.slice(0, maxQnAPairs);
    
    limitedQnA.forEach((data) => {
      // Truncate Q&A answer jos se on liian pitkä
      const truncatedAnswer = data.content.length > maxQnAAnswerChars
        ? data.content.substring(0, maxQnAAnswerChars) + "..."
        : data.content;
      instruction += config.systemInstructions.qna.format(data.name, truncatedAnswer);
    });
  }

  return instruction;
}

