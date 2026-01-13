import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { handleChatStream } from "./handlers/chatHandler";
import { handleConversationSummary } from "./handlers/summaryHandler";
import { handleGenerateTrainingData } from "./handlers/trainingHandler";
import { handleAnalyzeConversations } from "./handlers/analysisHandler";
import { handleTranslateText } from "./handlers/translateHandler";
import { handleCreateUser } from "./handlers/userHandler";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Main chat streaming function
export const geminiChatStream = functions.https.onCall(handleChatStream);

// Conversation summary function
export const geminiConversationSummary = functions.https.onCall(handleConversationSummary);

// Generate training data from text
export const geminiGenerateTrainingData = functions.https.onCall(handleGenerateTrainingData);

// Analyze conversations
export const geminiAnalyzeConversations = functions.https.onCall(handleAnalyzeConversations);

// Translate text
export const geminiTranslateText = functions.https.onCall(handleTranslateText);

// Create User Function
export const createUser = functions.https.onCall(handleCreateUser);
