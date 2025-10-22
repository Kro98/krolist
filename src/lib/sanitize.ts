import DOMPurify from 'dompurify';

/**
 * Sanitizes user-generated or external content to prevent XSS attacks
 * @param dirty - The potentially unsafe string to sanitize
 * @param allowHtml - Whether to allow HTML tags (default: false)
 * @returns Sanitized string safe for display
 */
export const sanitizeContent = (dirty: string | null | undefined, allowHtml: boolean = false): string => {
  if (!dirty) return '';
  
  // If HTML is not allowed, strip all tags and return plain text
  if (!allowHtml) {
    return DOMPurify.sanitize(dirty, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true 
    });
  }
  
  // If HTML is allowed, sanitize but keep safe tags
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
};

/**
 * Sanitizes product data from external sources
 */
export const sanitizeProductData = (product: {
  title?: string;
  description?: string;
  [key: string]: any;
}) => {
  return {
    ...product,
    title: product.title ? sanitizeContent(product.title) : '',
    description: product.description ? sanitizeContent(product.description) : '',
  };
};

