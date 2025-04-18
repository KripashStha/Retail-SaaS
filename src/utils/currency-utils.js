/**
 * Utility functions for currency formatting
 * These are standalone functions that don't rely on the context
 * For components, it's recommended to use the useCurrency hook instead
 */

/**
 * Formats a number as currency with the specified currency code
 * @param {number|string} amount - The amount to format
 * @param {string} currencyCode - The ISO currency code (e.g., 'USD', 'EUR')
 * @param {Object} options - Additional formatting options
 * @returns {string} - The formatted currency string
 */
export const formatAsCurrency = (amount, currencyCode = 'USD', options = {}) => {
    if (amount === undefined || amount === null) return "";
    
    // Parse the amount to ensure it's a number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle NaN
    if (isNaN(numericAmount)) return "";
  
    // Currency symbol mapping with locale info
    const currencyConfig = {
      USD: { locale: "en-US" },
      EUR: { locale: "de-DE" },
      GBP: { locale: "en-GB" },
      JPY: { locale: "ja-JP" },
      CAD: { locale: "en-CA" },
      AUD: { locale: "en-AU" },
      INR: { locale: "en-IN" },
      NPR: { locale: "ne-NP" },
    };
    
    // Get locale or default to en-US
    const locale = currencyConfig[currencyCode]?.locale || "en-US";
    
    // Format the number using Intl.NumberFormat
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: options.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 2,
      maximumFractionDigits: options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2,
      ...options
    });
  
    return formatter.format(numericAmount);
  };
  
  /**
   * Gets the currency symbol for a given currency code
   * @param {string} currencyCode - The ISO currency code (e.g., 'USD', 'EUR')
   * @returns {string} - The currency symbol
   */
  export const getCurrencySymbolForCode = (currencyCode = 'USD') => {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      INR: "₹",
      NPR: "रू",
    };
    
    return symbols[currencyCode] || "$";
  };
  
  /**
   * Formats a number as a plain number with the appropriate locale
   * @param {number|string} amount - The amount to format
   * @param {string} currencyCode - The ISO currency code to get the appropriate locale
   * @param {Object} options - Additional formatting options
   * @returns {string} - The formatted number string
   */
  export const formatAsNumber = (amount, currencyCode = 'USD', options = {}) => {
    if (amount === undefined || amount === null) return "";
    
    // Parse the amount to ensure it's a number
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle NaN
    if (isNaN(numericAmount)) return "";
  
    // Currency locale mapping
    const currencyConfig = {
      USD: { locale: "en-US" },
      EUR: { locale: "de-DE" },
      GBP: { locale: "en-GB" },
      JPY: { locale: "ja-JP" },
      CAD: { locale: "en-CA" },
      AUD: { locale: "en-AU" },
      INR: { locale: "en-IN" },
      NPR: { locale: "ne-NP" },
    };
    
    // Get locale or default to en-US
    const locale = currencyConfig[currencyCode]?.locale || "en-US";
    
    // Format the number using Intl.NumberFormat
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: options.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 2,
      maximumFractionDigits: options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2,
      ...options
    });
  
    return formatter.format(numericAmount);
  }; 