import * as admin from "firebase-admin";
import { config } from "../config";
import { logger } from "../utils/logger";

const db = admin.firestore();

// Helper function to check if conversation is a simulation
const isSimulationConversation = (conversationId: string): boolean => {
  return conversationId.startsWith('sim_conv_') || conversationId.startsWith('sim_');
};

// Submit Contact Form
export async function submitContactForm(
  conversationId: string,
  botId: string,
  visitorId: string,
  visitorName: string,
  data: { name: string; email: string; message: string }
) {
  logger.info(`submitContactForm called with:`, {
    conversationId,
    botId,
    visitorId,
    visitorName,
    formData: { name: data.name, email: data.email, messageLength: data.message?.length || 0 }
  });

  // Skip database operations for simulation conversations
  if (isSimulationConversation(conversationId)) {
    logger.info(`Skipping database save for simulation conversation: ${conversationId}`);
    return {
      success: true,
      message: config.messages.contactForm.success,
    };
  }

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

    logger.info(`Created submission object:`, {
      id: submission.id,
      type: submission.type,
      visitorName: submission.visitorName
    });

    const convRef = db.collection("conversations").doc(conversationId);
    logger.info(`Checking if conversation document exists: ${conversationId}`);
    
    // Tarkista onko dokumentti olemassa
    const docSnapshot = await convRef.get();
    logger.info(`Document exists: ${docSnapshot.exists}`);
    
    if (!docSnapshot.exists) {
      // Jos dokumentti ei ole olemassa, luo se ensin
      logger.info(`Document does not exist, creating new conversation document`);
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
      logger.info(`Successfully created new conversation document with submission`);
    } else {
      // Jos dokumentti on olemassa, päivitä se
      logger.info(`Document exists, updating with arrayUnion`);
      await convRef.update({
        submissions: admin.firestore.FieldValue.arrayUnion(submission),
      });
      logger.info(`Successfully updated conversation document with submission`);
    }

    const result = {
      success: true,
      message: config.messages.contactForm.success,
    };
    logger.info(`Contact form submitted successfully for conversation ${conversationId}`, result);
    return result;
  } catch (error: any) {
    logger.error("Error submitting contact form:", error);
    logger.error("Error details:", {
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
export async function submitQuoteRequest(
  conversationId: string,
  botId: string,
  visitorId: string,
  visitorName: string,
  data: { name: string; email: string; company?: string; details: string }
) {
  logger.info(`submitQuoteRequest called with:`, {
    conversationId,
    botId,
    visitorId,
    visitorName,
    formData: { name: data.name, email: data.email, company: data.company, detailsLength: data.details?.length || 0 }
  });

  // Skip database operations for simulation conversations
  if (isSimulationConversation(conversationId)) {
    logger.info(`Skipping database save for simulation conversation: ${conversationId}`);
    return {
      success: true,
      message: config.messages.quoteRequest.success,
    };
  }

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

    logger.info(`Created quote submission object:`, {
      id: submission.id,
      type: submission.type,
      visitorName: submission.visitorName
    });

    const convRef = db.collection("conversations").doc(conversationId);
    logger.info(`Checking if conversation document exists: ${conversationId}`);
    
    // Tarkista onko dokumentti olemassa
    const docSnapshot = await convRef.get();
    logger.info(`Document exists: ${docSnapshot.exists}`);
    
    if (!docSnapshot.exists) {
      // Jos dokumentti ei ole olemassa, luo se ensin
      logger.info(`Document does not exist, creating new conversation document`);
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
      logger.info(`Successfully created new conversation document with quote submission`);
    } else {
      // Jos dokumentti on olemassa, päivitä se
      logger.info(`Document exists, updating with arrayUnion`);
      await convRef.update({
        submissions: admin.firestore.FieldValue.arrayUnion(submission),
      });
      logger.info(`Successfully updated conversation document with quote submission`);
    }

    const result = {
      success: true,
      message: config.messages.quoteRequest.success,
    };
    logger.info(`Quote request submitted successfully for conversation ${conversationId}`, result);
    return result;
  } catch (error: any) {
    logger.error("Error submitting quote request:", error);
    logger.error("Error details:", {
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

