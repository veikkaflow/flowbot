import * as functions from "firebase-functions";
import { getAiClient } from "../services/geminiService";
import { config } from "../config";
import { logger } from "../utils/logger";

// Translate text
export async function handleTranslateText(
  data: { text: string; targetLanguage: "fi" | "en" },
  context: functions.https.CallableContext
) {
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
    logger.error("Error translating text:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to translate text",
      error.message
    );
  }
}

