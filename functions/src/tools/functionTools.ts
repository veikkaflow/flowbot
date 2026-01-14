import { Type, FunctionDeclaration } from "@google/genai";
import { config } from "../config";

// Get Products Tool (same as client-side)
export const getProductsTool: FunctionDeclaration = {
  name: "getProducts",
  description: config.tools.getProducts.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: config.tools.getProducts.parameters.category,
      },
      searchTerm: {
        type: Type.STRING,
        description: config.tools.getProducts.parameters.searchTerm,
      },
    },
    required: [],
  },
};

// Submit Contact Form Tool
export const submitContactFormTool: FunctionDeclaration = {
  name: "submitContactForm",
  description: config.tools.submitContactForm.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: config.tools.submitContactForm.parameters.name,
      },
      email: {
        type: Type.STRING,
        description: config.tools.submitContactForm.parameters.email,
      },
      message: {
        type: Type.STRING,
        description: config.tools.submitContactForm.parameters.message,
      },
    },
    required: ["name", "email", "message"],
  },
};

// Submit Quote Request Tool
export const submitQuoteFormTool: FunctionDeclaration = {
  name: "submitQuoteRequest",
  description: config.tools.submitQuoteRequest.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.name,
      },
      email: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.email,
      },
      company: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.company,
      },
      details: {
        type: Type.STRING,
        description: config.tools.submitQuoteRequest.parameters.details,
      },
    },
    required: ["name", "email", "details"],
  },
};

// Search Knowledge Base Tool
export const searchKnowledgeBaseTool: FunctionDeclaration = {
  name: "searchKnowledgeBase",
  description: config.tools.searchKnowledgeBase.description,
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: config.tools.searchKnowledgeBase.parameters.query,
      },
      maxResults: {
        type: Type.NUMBER,
        description: config.tools.searchKnowledgeBase.parameters.maxResults,
      },
    },
    required: ["query"],
  },
};

// Add Rich Content Tool
export const addRichContentTool: FunctionDeclaration = {
  name: "addRichContent",
  description: "Lisää rich content -kortti viestiin (henkilökortti tai tuotekortti). Käytä tätä kun haluat näyttää strukturoidun kortin käyttäjälle.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ["personCard", "productCard"],
        description: "Kortin tyyppi: 'personCard' henkilökortille tai 'productCard' tuotekortille"
      },
      // PersonCard fields
      name: {
        type: Type.STRING,
        description: "Henkilön nimi (pakollinen personCard-tyypille)"
      },
      avatar: {
        type: Type.STRING,
        description: "Avatar-kuvan URL (valinnainen)"
      },
      email: {
        type: Type.STRING,
        description: "Sähköpostiosoite (valinnainen, pelkkä teksti ilman Markdown-linkkejä)"
      },
      phone: {
        type: Type.STRING,
        description: "Puhelinnumero (valinnainen, pelkkä teksti ilman Markdown-linkkejä)"
      },
      whatsapp: {
        type: Type.STRING,
        description: "WhatsApp-numero (valinnainen, pelkkä teksti ilman Markdown-linkkejä)"
      },
      // ProductCard fields
      title: {
        type: Type.STRING,
        description: "Tuotteen nimi (pakollinen productCard-tyypille)"
      },
      image: {
        type: Type.STRING,
        description: "Tuotekuvan URL (valinnainen)"
      },
      url: {
        type: Type.STRING,
        description: "Tuotesivun URL (pakollinen productCard-tyypille)"
      },
      description: {
        type: Type.STRING,
        description: "Tuotteen kuvaus (valinnainen)"
      }
    },
    required: ["type"]
  },
};


