const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
};

/**
 * Returns the primary currency symbol for a given 3-letter currency code.
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const code = (currencyCode || 'USD').toUpperCase().trim();
  return CURRENCY_SYMBOL_MAP[code] || code;
}

/**
 * Robust currency formatter supporting locale-aware separators and symbol fallbacks.
 */
export function formatWorkspaceCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'USD'
): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const code = (currencyCode || 'USD').toUpperCase().trim();
  const locale = CURRENCY_LOCALE_MAP[code] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Graceful fallback if currency code is not supported by runtime
    const symbol = getCurrencySymbol(code);
    return `${symbol}${value.toFixed(2)}`;
  }
}

/**
 * Compact currency formatter for dashboard stat cards and charts (e.g. $1.2K, $4.5M).
 */
export function formatCompactCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'USD'
): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const code = (currencyCode || 'USD').toUpperCase().trim();
  const locale = CURRENCY_LOCALE_MAP[code] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    const symbol = getCurrencySymbol(code);
    if (Math.abs(value) >= 1_000_000) {
      return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${symbol}${(value / 1_000).toFixed(1)}K`;
    }
    return `${symbol}${value.toFixed(0)}`;
  }
}
