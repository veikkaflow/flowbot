// Validation utilities

import { RichContent } from '../types';

/**
 * Validates rich content item
 */
export function validateRichContent(content: any): content is RichContent {
  if (!content || typeof content !== 'object') return false;
  
  if (content.type === 'personCard') {
    return typeof content.name === 'string' && content.name.length > 0;
  }
  
  if (content.type === 'productCard') {
    return typeof content.title === 'string' && 
           content.title.length > 0 &&
           typeof content.url === 'string' &&
           content.url.length > 0;
  }
  
  return false;
}

/**
 * Validates email address
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number (basic validation)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Remove spaces, dashes, parentheses, and plus signs for validation
  const cleaned = phone.replace(/[\s\-()\+]/g, '');
  // Check if it contains only digits and is at least 7 characters long
  return /^\d{7,15}$/.test(cleaned);
}

/**
 * Validates URL
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

