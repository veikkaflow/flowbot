import * as functions from "firebase-functions";
import { Conversation } from "../types";
import { getAiClient } from "../services/geminiService";
import { config } from "../config";
import { logger } from "../utils/logger";
import { MAX_CONVERSATION_TEXT_LENGTH } from "../../../constants/index";

// Conversation summary function
export async function handleConversationSummary(
  data: { conversation: Conversation },
  context: functions.https.CallableContext
) {
  try {
    const { conversation } = data;
    const ai = getAiClient();

    // Käytä kaikkia viestejä (koko chatin konteksti)
    // Varmista että viestit eivät sisällä undefined/null arvoja
    const conversationText = conversation.messages
      .filter((m) => {
        // Poista system-viestit ja viestit ilman tekstiä
        return m.sender !== "system" && m.text && typeof m.text === 'string' && m.text.trim().length > 0;
      })
      .map((m) => {
        // Varmista että sender ja text ovat olemassa
        const sender = m.sender || 'unknown';
        const text = (m.text || '').trim();
        return `${sender}: ${text}`;
      })
      .join("\n");

    logger.info(`Conversation text length: ${conversationText.length} chars, messages: ${conversation.messages.length}`);

    // Rajoita conversationText kokoa jos se on liian pitkä
    // Mutta käytä mahdollisimman paljon dataa
    const truncatedConversationText = conversationText.length > MAX_CONVERSATION_TEXT_LENGTH
      ? conversationText.substring(0, MAX_CONVERSATION_TEXT_LENGTH) + "\n\n[... keskustelu jatkuu ...]"
      : conversationText;

    const prompt = config.analysis.conversationSummary.prompt(truncatedConversationText);

    logger.info(`Prompt length: ${prompt.length} chars`);

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
    logger.error("Error generating conversation summary:", error);
    logger.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      conversationId: data.conversation?.id,
      messageCount: data.conversation?.messages?.length,
      conversationTextLength: data.conversation?.messages
        ?.filter((m) => m.sender !== "system" && m.text)
        .map((m) => `${m.sender}: ${m.text}`)
        .join("\n").length || 0
    });
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate summary",
      error.message
    );
  }
}

