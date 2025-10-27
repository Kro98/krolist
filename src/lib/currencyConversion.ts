import { supabase } from "@/integrations/supabase/client";

export type Currency = 'USD' | 'SAR' | 'EGP' | 'AED';

// Cache for exchange rates to avoid unnecessary database calls
let cachedRates: Record<Currency, number> | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Fallback exchange rates (used if database fetch fails)
const fallbackRates: Record<Currency, number> = {
  USD: 1,
  SAR: 3.75,
  EGP: 30.90,
  AED: 3.67,
};

/**
 * Fetch exchange rates from database
 */
async function fetchExchangeRates(): Promise<Record<Currency, number>> {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('currency, rate_to_usd');

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn('No exchange rates in database, using fallback');
      return fallbackRates;
    }

    const rates: Record<Currency, number> = {} as Record<Currency, number>;
    data.forEach((row: any) => {
      if (row.currency && row.rate_to_usd) {
        // Convert rate_to_usd back to "1 USD = X currency" format
        rates[row.currency as Currency] = 1 / Number(row.rate_to_usd);
      }
    });

    // Ensure all currencies are present, use fallback for missing ones
    const currencies: Currency[] = ['USD', 'SAR', 'EGP', 'AED'];
    currencies.forEach(currency => {
      if (!rates[currency]) {
        rates[currency] = fallbackRates[currency];
      }
    });

    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return fallbackRates;
  }
}

/**
 * Get exchange rates (with caching)
 */
async function getExchangeRates(): Promise<Record<Currency, number>> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetch) < CACHE_DURATION) {
    return cachedRates;
  }

  // Fetch fresh rates
  cachedRates = await fetchExchangeRates();
  lastFetch = now;
  
  return cachedRates;
}

/**
 * Convert price from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount rounded to 2 decimal places
 */
export async function convertPrice(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = await getExchangeRates();
  
  // Convert to USD first (as base currency)
  const amountInUSD = amount / rates[fromCurrency];
  
  // Convert from USD to target currency
  const convertedAmount = amountInUSD * rates[toCurrency];
  
  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Synchronous version using cached rates or fallback
 */
export function convertPriceSync(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = cachedRates || fallbackRates;
  const amountInUSD = amount / rates[fromCurrency];
  const convertedAmount = amountInUSD * rates[toCurrency];
  
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
