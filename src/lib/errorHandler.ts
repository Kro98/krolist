// Error handling utilities for secure error messages

interface ErrorMapping {
  code: string;
  userMessage: string;
}

const ERROR_MAPPINGS: ErrorMapping[] = [
  { code: '23505', userMessage: 'This item already exists in your list' },
  { code: '23503', userMessage: 'Unable to complete action. Please try again' },
  { code: 'PGRST116', userMessage: 'Item not found' },
  { code: '42501', userMessage: 'You do not have permission to perform this action' },
  { code: 'auth/invalid-credentials', userMessage: 'Invalid credentials. Please try again' },
  { code: 'auth/user-not-found', userMessage: 'Invalid credentials. Please try again' },
  { code: 'auth/wrong-password', userMessage: 'Invalid credentials. Please try again' },
  { code: 'auth/email-already-in-use', userMessage: 'This email is already registered' },
];

/**
 * Maps technical error codes/messages to user-friendly messages
 * Logs detailed errors server-side (console) while showing safe messages to users
 */
export function getSafeErrorMessage(error: any): string {
  // Log full error for debugging (only visible in dev console, not to end users)
  if (process.env.NODE_ENV === 'development') {
    console.error('[Debug] Full error details:', error);
  }
  
  // Extract error code or message
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  
  // Check for specific error codes
  for (const mapping of ERROR_MAPPINGS) {
    if (errorCode === mapping.code || errorMessage.includes(mapping.code)) {
      return mapping.userMessage;
    }
  }
  
  // Check for rate limiting
  if (errorMessage.includes('limit') || errorMessage.includes('429')) {
    return 'You have reached your usage limit. Please try again later';
  }
  
  // Check for authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
    return 'Authentication required. Please login to continue';
  }
  
  // Check for network errors
  if (errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
    return 'Network error. Please check your connection and try again';
  }
  
  // Default generic message
  return 'An error occurred. Please try again later';
}

/**
 * Validates and sanitizes error messages before logging
 * Removes sensitive information from error messages
 */
export function sanitizeErrorForLogging(error: any): string {
  const errorString = error?.message || String(error);
  
  // Remove potential sensitive data patterns
  return errorString
    .replace(/Bearer\s+[\w-]+/gi, 'Bearer [REDACTED]')
    .replace(/password["\s:=]+[\w@#$%^&*]+/gi, 'password [REDACTED]')
    .replace(/token["\s:=]+[\w-]+/gi, 'token [REDACTED]')
    .replace(/api[_-]?key["\s:=]+[\w-]+/gi, 'apikey [REDACTED]');
}
