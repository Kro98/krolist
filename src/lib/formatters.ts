/**
 * Format a string to title case
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Format a number as currency with proper symbol
 */
export const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  const symbols: Record<string, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  
  return `${amount.toLocaleString()} ${symbols[currency] || currency}`;
};

/**
 * Truncate text to a maximum length with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
