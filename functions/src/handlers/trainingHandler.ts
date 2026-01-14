import * as functions from "firebase-functions";
import { Type } from "@google/genai";
import { getAiClient } from "../services/geminiService";
import { config } from "../config";
import { logger } from "../utils/logger";
import { MAX_TRAINING_TEXT_LENGTH } from "../../../constants/index";

// Generate training data from text
export async function handleGenerateTrainingData(
  data: { text: string; title: string },
  context: functions.https.CallableContext
) {
  try {
    const { text, title } = data;
    const ai = getAiClient();

    if (!text || text.trim().length === 0) {
      return { data: [] };
    }

    const textToUse = text.substring(0, MAX_TRAINING_TEXT_LENGTH);
    logger.info(`Using ${textToUse.length} characters for Q&A generation`);

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
    logger.error("Error generating training data:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate training data",
      error.message
    );
  }
}

