export type Currency = 'USD' | 'SAR' | 'EGP' | 'AED';

// Exchange rates relative to USD (as of 2025)
const exchangeRates: Record<Currency, number> = {
  USD: 1,
  SAR: 3.75,    // 1 USD = 3.75 SAR
  EGP: 30.90,   // 1 USD = 30.90 EGP
  AED: 3.67,    // 1 USD = 3.67 AED
};

/**
 * Convert price from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount rounded to 2 decimal places
 */
export function convertPrice(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first (as base currency)
  const amountInUSD = amount / exchangeRates[fromCurrency];
  
  // Convert from USD to target currency
  const convertedAmount = amountInUSD * exchangeRates[toCurrency];
  
  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(
  amount: number,
  currency: Currency
): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    SAR: 'SAR',
    EGP: 'EGP',
    AED: 'AED',
  };
  
  return `${symbols[currency]} ${amount.toFixed(2)}`;
}
