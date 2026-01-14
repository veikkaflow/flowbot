// Validation utilities for functions

import { RichContent } from '../types';

/**
 * Validates email address
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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
