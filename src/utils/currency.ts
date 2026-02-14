/**
 * Currency formatting utility functions
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'INR';

/**
 * Format amount with the specified currency
 */
export const formatCurrency = (amount: number, currency: Currency = 'AED'): string => {
  const locale = currency === 'AED' ? 'ar-AE' : currency === 'INR' ? 'en-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    AED: 'د.إ',
    INR: '₹'
  };
  
  return symbols[currency] || '$';
};

/**
 * Get currency name
 */
export const getCurrencyName = (currency: Currency): string => {
  const names: Record<Currency, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    AED: 'UAE Dirham',
    INR: 'Indian Rupee'
  };
  
  return names[currency] || 'US Dollar';
};
