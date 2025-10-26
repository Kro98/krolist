import { useLanguage } from '@/contexts/LanguageContext';
import { convertPrice, Currency } from '@/lib/currencyConversion';

export function useConvertedPrice() {
  const { currency } = useLanguage();
  
  /**
   * Convert a price from its original currency to the selected display currency
   */
  const convertPriceToDisplay = (
    originalPrice: number,
    originalCurrency: string
  ): number => {
    return convertPrice(originalPrice, originalCurrency as Currency, currency as Currency);
  };
  
  /**
   * Format a price with the current currency symbol
   */
  const formatDisplayPrice = (
    originalPrice: number,
    originalCurrency: string
  ): string => {
    const converted = convertPriceToDisplay(originalPrice, originalCurrency);
    return `${currency} ${converted.toFixed(2)}`;
  };
  
  return {
    currency,
    convertPriceToDisplay,
    formatDisplayPrice,
  };
}
