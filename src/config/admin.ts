/**
 * 🛠️ KROLIST ADMIN CONFIGURATION
 * 
 * This file contains all admin-configurable values.
 * Update these when you need to change Krolist settings.
 * 
 * For detailed instructions, see: src/config/README.md
 */

export const ADMIN_CONFIG = {
  /**
   * 📦 PRODUCT LIMITS
   * Maximum number of products a user can track
   */
  MAX_PRODUCTS_PER_USER: 100,
  
  /**
   * 🎟️ PROMO CODE LIMITS
   * Maximum number of promo codes a user can save
   */
  MAX_PROMO_CODES_PER_USER: 24,
  
  /**
   * 💱 EXCHANGE RATE API
   * API endpoint for fetching currency exchange rates
   * Used by the edge function: supabase/functions/update-exchange-rates
   */
  EXCHANGE_RATE_API: {
    URL: 'https://api.exchangerate-api.com/v4/latest/USD',
    UPDATE_INTERVAL_HOURS: 24,
  },
  
  /**
   * ☕ DONATION PAGE
   * Ko-fi donation page username
   * Full URL will be: https://ko-fi.com/${KOFI_USERNAME}
   */
  KOFI_USERNAME: 'krolist',
  
  /**
   * 📱 SOCIAL MEDIA LINKS
   * Add your social media profile URLs here
   */
  SOCIAL_LINKS: {
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
  },
  
  /**
   * 🔍 SEARCH SETTINGS
   * Configure search behavior
   */
  SEARCH: {
    // Minimum characters required for search
    MIN_SEARCH_LENGTH: 2,
    // Maximum search results to display
    MAX_RESULTS: 50,
  },
  
  /**
   * 📧 CONTACT EMAIL
   * Support email displayed on Contact Us page
   */
  SUPPORT_EMAIL: 'support@krolist.com',
  
  /**
   * 🎨 FEATURE FLAGS
   * Enable/disable features across the app
   */
  FEATURES: {
    // Enable analytics page
    ANALYTICS_ENABLED: true,
    // Enable promo codes feature
    PROMO_CODES_ENABLED: true,
    // Enable events/sales calendar
    EVENTS_ENABLED: true,
    // Enable donation page
    DONATIONS_ENABLED: true,
  },
} as const;

// Type helper for auto-completion
export type AdminConfig = typeof ADMIN_CONFIG;
