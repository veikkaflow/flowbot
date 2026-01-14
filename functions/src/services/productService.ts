import { config } from "../config";
import { logger } from "../utils/logger";

// Mock products API (same as client-side)
export async function getProductsFromApi(category?: string, searchTerm?: string) {
  try {
    logger.info(`Haetaan tuotteita... Kategoria: ${category}, Hakusana: ${searchTerm}`);
    
    // Simuloitu API-vastaus
    const mockApiResponse = config.mockData.products;

    return mockApiResponse;
  } catch (error) {
    logger.error("API call to getProducts failed:", error);
    return { error: config.messages.products.error };
  }
}


