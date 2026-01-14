import * as functions from "firebase-functions";
import { Type } from "@google/genai";
import { Conversation, AnalysisResult } from "../types";
import { getAiClient } from "../services/geminiService";
import { config } from "../config";
import { logger } from "../utils/logger";

// Analyze conversations
export async function handleAnalyzeConversations(
  data: { conversations: Conversation[] },
  context: functions.https.CallableContext
) {
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
      logger.error("Circular reference detected in conversation data analysis", e);
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
    logger.error("Error analyzing conversations:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to analyze conversations",
      error.message
    );
  }
}


