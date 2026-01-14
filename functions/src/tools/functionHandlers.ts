// Function call handlers registry

import { getProductsFromApi } from "../services/productService";
import { submitContactForm, submitQuoteRequest } from "../services/formService";
import { searchKnowledgeBase } from "../services/knowledgeService";
import { FunctionCallArgs, FunctionContext, RichContent } from "../types";
import { logger } from "../utils/logger";
import { validateEmail, validateRichContent } from "../utils/validators";

export type FunctionHandler = <K extends keyof FunctionCallArgs>(
  args: FunctionCallArgs[K],
  context: FunctionContext
) => Promise<any>;

// Truncate function response if too large
function truncateResponse(result: any, maxChars: number): any {
  if (result && typeof result === 'object') {
    const resultStr = JSON.stringify(result);
    if (resultStr.length > maxChars) {
      // Truncate JSON string if too long
      return { 
        error: 'Response too large, truncated',
        data: resultStr.substring(0, maxChars - 100) + '...'
      };
    }
  }
  return result;
}

// Truncate knowledge base results if too large
function truncateKnowledgeBaseResponse(result: any, maxChars: number): any {
  if (result && typeof result === 'object') {
    const resultStr = JSON.stringify(result);
    if (resultStr.length > maxChars) {
      // Limit results if it's an array
      if (result.results && Array.isArray(result.results) && result.results.length > 5) {
        result.results = result.results.slice(0, 5);
      }
      // Check size again
      const truncatedStr = JSON.stringify(result);
      if (truncatedStr.length > maxChars) {
        // Truncate each result's content
        if (result.results && Array.isArray(result.results)) {
          result.results = result.results.map((r: any) => {
            if (r.content && r.content.length > 500) {
              r.content = r.content.substring(0, 500) + "...";
            }
            return r;
          });
        }
      }
    }
  }
  return result;
}

// Function handlers registry
export const functionHandlers: {
  [K in keyof FunctionCallArgs]: (args: FunctionCallArgs[K], context: FunctionContext) => Promise<any>
} = {
  getProducts: async (args: FunctionCallArgs['getProducts'], context) => {
    const result = await getProductsFromApi(args.category, args.searchTerm);
    return truncateResponse(result, context.maxResponseChars);
  },

  submitContactForm: async (args: FunctionCallArgs['submitContactForm'], context) => {
    // Validate required fields
    if (!args.name || args.name.trim().length === 0) {
      logger.warn('submitContactForm: Missing or empty name');
      return { success: false, error: 'Name is required' };
    }
    
    if (!args.email || !validateEmail(args.email)) {
      logger.warn('submitContactForm: Invalid email');
      return { success: false, error: 'Valid email is required' };
    }
    
    if (!args.message || args.message.trim().length === 0) {
      logger.warn('submitContactForm: Missing or empty message');
      return { success: false, error: 'Message is required' };
    }
    
    logger.info(`Processing submitContactForm function call:`, {
      conversationId: context.conversationId,
      args: { name: args.name, email: args.email, messageLength: args.message?.length || 0 }
    });
    const result = await submitContactForm(
      context.conversationId,
      context.botId,
      context.visitorId,
      context.visitorName,
      args
    );
    logger.info(`submitContactForm result:`, result);
    return result;
  },

  submitQuoteRequest: async (args: FunctionCallArgs['submitQuoteRequest'], context) => {
    // Validate required fields
    if (!args.name || args.name.trim().length === 0) {
      logger.warn('submitQuoteRequest: Missing or empty name');
      return { success: false, error: 'Name is required' };
    }
    
    if (!args.email || !validateEmail(args.email)) {
      logger.warn('submitQuoteRequest: Invalid email');
      return { success: false, error: 'Valid email is required' };
    }
    
    if (!args.details || args.details.trim().length === 0) {
      logger.warn('submitQuoteRequest: Missing or empty details');
      return { success: false, error: 'Details are required' };
    }
    
    logger.info(`Processing submitQuoteRequest function call:`, {
      conversationId: context.conversationId,
      args: { name: args.name, email: args.email, company: args.company, detailsLength: args.details?.length || 0 }
    });
    const result = await submitQuoteRequest(
      context.conversationId,
      context.botId,
      context.visitorId,
      context.visitorName,
      args
    );
    logger.info(`submitQuoteRequest result:`, result);
    return result;
  },

  searchKnowledgeBase: async (args: FunctionCallArgs['searchKnowledgeBase'], context) => {
    const result = await searchKnowledgeBase(context.settings, args.query, args.maxResults);
    return truncateKnowledgeBaseResponse(result, context.maxResponseChars);
  },

  addRichContent: async (args: FunctionCallArgs['addRichContent'], context) => {
    // Handle rich content - return the data to be collected
    logger.info(`Received addRichContent call:`, args);
    
    // Validate rich content using validator
    if (!validateRichContent(args)) {
      logger.warn('Invalid rich content:', args);
      return { success: false, error: 'Invalid rich content data' };
    }
    
    // Validate and return rich content item
    let richContentItem: RichContent;
    
    if (args.type === 'personCard') {
      if (!args.name) {
        logger.warn('PersonCard missing required field: name');
        return { success: false, error: 'Name is required for personCard' };
      }
      richContentItem = {
        type: 'personCard',
        name: args.name,
        ...(args.avatar && { avatar: args.avatar }),
        ...(args.email && { email: args.email }),
        ...(args.phone && { phone: args.phone }),
        ...(args.whatsapp && { whatsapp: args.whatsapp }),
      };
    } else if (args.type === 'productCard') {
      if (!args.title || !args.url) {
        logger.warn('ProductCard missing required fields: title or url');
        return { success: false, error: 'Title and URL are required for productCard' };
      }
      richContentItem = {
        type: 'productCard',
        title: args.title,
        url: args.url,
        ...(args.image && { image: args.image }),
        ...(args.description && { description: args.description }),
      };
    } else {
      logger.warn(`Invalid rich content type: ${(args as any).type}`);
      return { success: false, error: 'Invalid rich content type' };
    }
    
    logger.info(`Added rich content item:`, richContentItem);
    // Return special marker to indicate this is rich content
    return { __isRichContent: true, richContentItem };
  }
};

