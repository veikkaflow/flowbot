import * as functions from "firebase-functions";
import { Conversation, AppSettings, RichContent } from "../types";
import { getAiClient, buildChatContents, buildSystemInstruction } from "../services/geminiService";
import { needsKnowledgeBase, selectRelevantKnowledgeSources } from "../services/knowledgeService";
import { getProductsTool, submitContactFormTool, submitQuoteFormTool, searchKnowledgeBaseTool, addRichContentTool } from "../tools/functionTools";
import { functionHandlers } from "../tools/functionHandlers";
import { FunctionContext } from "../types";
import { config } from "../config";
import { logger } from "../utils/logger";

// Main chat streaming function
export async function handleChatStream(
  data: { conversation: Conversation; settings: AppSettings },
  context: functions.https.CallableContext
) {
  try {
    const { conversation, settings } = data;
    const ai = getAiClient();
    const contents = await buildChatContents(
      conversation,
      settings,
      undefined,
      needsKnowledgeBase,
      selectRelevantKnowledgeSources
    );
    const systemInstruction = buildSystemInstruction(settings);

    // Vaihe A: Ensimmäinen kutsu Geminille työkalujen kanssa
    const allTools = [
      getProductsTool,
      submitContactFormTool,
      submitQuoteFormTool,
      searchKnowledgeBaseTool,
    ];
    
    // Add rich content tool if enabled
    if (settings.behavior.richContentEnabled) {
      allTools.push(addRichContentTool);
    }

    const initialResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: allTools }],
      },
    });

    const functionCalls = initialResponse.functionCalls || [];
    logger.debug(`Function calls received: ${JSON.stringify(functionCalls)}`);
    logger.info(`Checking for form-related function calls...`);
    const formCalls = functionCalls.filter(fc => fc.name === "submitContactForm" || fc.name === "submitQuoteRequest");
    if (formCalls.length > 0) {
      logger.info(`Found ${formCalls.length} form-related function call(s):`, formCalls.map(fc => ({ name: fc.name, args: fc.args })));
    }
    
    // If there are function calls, process them
    if (functionCalls.length > 0) {
      logger.debug(`Processing ${functionCalls.length} function call(s)`);
      const functionResponses: any[] = [];
      const richContentItems: RichContent[] = []; // Collect rich content items
      let updatedContents = [...contents];

      // Create function context
      const functionContext: FunctionContext = {
        conversationId: conversation.id,
        botId: conversation.botId,
        visitorId: conversation.visitorId,
        visitorName: conversation.visitorName,
        maxResponseChars: config.optimization.maxCharactersInFunctionResponse,
        settings: settings,
      };

      // Process each function call
      for (const functionCall of functionCalls) {
        if (!functionCall.name) {
          logger.warn(`Function call missing name:`, functionCall);
          continue;
        }
        
        const handler = functionHandlers[functionCall.name as keyof typeof functionHandlers];
        
        if (handler) {
          try {
            const args = (functionCall.args || {}) as any;
            const result = await handler(args, functionContext);
            
            // Check if this is rich content
            if (result && result.__isRichContent) {
              richContentItems.push(result.richContentItem);
              functionResponses.push({
                name: functionCall.name,
                response: { success: true, message: "Rich content added to message" },
              });
            } else {
              functionResponses.push({
                name: functionCall.name,
                response: result,
              });
            }
          } catch (error: any) {
            logger.error(`Error handling function call ${functionCall.name}:`, error);
            functionResponses.push({
              name: functionCall.name,
              response: { success: false, error: error.message || "Unknown error" },
            });
          }
        } else {
          logger.warn(`No handler found for function call: ${functionCall.name}`);
          functionResponses.push({
            name: functionCall.name,
            response: { success: false, error: `Unknown function: ${functionCall.name}` },
          });
        }

        // Add function call to contents
        updatedContents.push({
          role: "model",
          parts: [{ functionCall: functionCall }],
        });
      }

      // Add all function responses to contents
      logger.info(`Preparing to send function responses back to Gemini API`);
      logger.info(`Function responses count: ${functionResponses.length}`);
      functionResponses.forEach((fr, index) => {
        logger.debug(`Function response ${index + 1}:`, {
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

      logger.info(`Sending function responses to Gemini API for final response`);
      // Vaihe C: Lähetetään työkalujen tulokset takaisin Geminille
      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: updatedContents,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ functionDeclarations: allTools }],
        },
      });

      logger.info(`Received final response from Gemini API`);
      const finalText = finalResponse.text;
      logger.info(`Final response text length: ${finalText?.length || 0}`);
      logger.debug(`Final response text preview: ${finalText?.substring(0, 200) || '(empty)'}`);
      
      if (!finalText) {
        logger.error(`ERROR: Empty response from Gemini API after function call`);
        logger.error(`Function calls that were processed:`, functionCalls.map(fc => ({ name: fc.name, args: fc.args })));
        logger.error(`Function responses that were sent:`, functionResponses);
        throw new Error("Empty response from Gemini API");
      }

      logger.info(`Successfully returning final response to client`);
      
      // Return response with rich content if any was collected
      if (richContentItems.length > 0) {
        logger.info(`Returning ${richContentItems.length} rich content item(s)`);
        return {
          text: finalText,
          richContent: richContentItems
        };
      }
      
      return { 
        text: finalText
      };
    } else {
      // No function calls, return initial response
      const initialText = initialResponse.text;
      logger.debug(`No function calls - bot responded with text only`);
      logger.debug(`Response text: ${initialText?.substring(0, 200)}`);
      if (!initialText) {
        throw new Error("Empty response from Gemini API");
      }

      return { text: initialText };
    }
  } catch (error: any) {
    logger.error("Gemini API error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate chat response",
      error.message
    );
  }
}

