import { Type } from "@google/genai";
import { AppSettings, KnowledgeSource, Message } from "../types";
import { config } from "../config";
import { getAiClient } from "./geminiService";
import { logger } from "../utils/logger";

// Search Knowledge Base
export async function searchKnowledgeBase(
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
    logger.error("Error searching knowledge base:", error);
    return {
      success: false,
      error: config.messages.knowledgeBase.error,
      results: [],
    };
  }
}

// Dynaaminen RAG: Analysoi tarvitaanko knowledge base -tietoja
export async function needsKnowledgeBase(
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
      logger.error("Empty response from Gemini API");
      return true; // Fallback: käytetään tietopankkia
    }

    const result = JSON.parse(responseText);
    logger.info(`Knowledge base needed: ${result.needsKnowledgeBase}, reason: ${result.reason}`);
    return result.needsKnowledgeBase;
  } catch (error) {
    logger.error("Error analyzing if knowledge base is needed:", error);
    return true; // Fallback: käytetään tietopankkia
  }
}

// Dynaaminen RAG: Valitse relevantit knowledge source -tiedostot
export async function selectRelevantKnowledgeSources(
  userQuestion: string,
  knowledgeBase: KnowledgeSource[]
): Promise<string[]> {
  const maxSources = config.optimization.maxKnowledgeSourcesPerMessage;
  
  try {
    const ai = getAiClient();
    
    if (knowledgeBase.length <= maxSources) {
      logger.info(`Small knowledge base (${knowledgeBase.length} items), using all`);
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
      logger.error("Empty response from Gemini API");
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
    
    logger.info(`Selected ${finalIds.length} relevant knowledge sources: ${finalIds.join(", ")}`);
    return finalIds;
  } catch (error) {
    logger.error("Error selecting relevant knowledge sources:", error);
    return knowledgeBase.slice(0, maxSources).map((_, idx) => idx.toString());
  }
}

