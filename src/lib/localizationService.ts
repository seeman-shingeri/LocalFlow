/**
 * LocalFlow AI — Enterprise Date & Currency Localization Service
 *
 * Implements Indian numbering system (Lakh/Crore) and international standard
 * financial currency formatting, compact denomination abbreviators, and locale-aware dates.
 */

export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  decimalPlaces?: number;
}

/**
 * Formats monetary amounts with appropriate currency symbol and number grouping.
 * Defaults to Indian Rupee (INR) and Indian locale (en-IN).
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const { currency = 'INR', locale = 'en-IN', decimalPlaces = 2 } = options;
  if (isNaN(amount)) return '—';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);
  } catch {
    // Graceful fallback
    return `${currency} ${amount.toFixed(decimalPlaces)}`;
  }
}

/**
 * Formats large monetary numbers into concise human-readable tags
 * (e.g. ₹1.5L, ₹3.2Cr for en-IN, or $2.5M for en-US).
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  if (isNaN(amount)) return '—';

  const symbol = getCurrencySymbol(currency, locale);
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  if (locale === 'en-IN' || currency === 'INR') {
    if (abs >= 10000000) {
      // 1 Crore = 10,000,000
      const cr = (abs / 10000000).toFixed(2).replace(/\.?0+$/, '');
      return `${isNegative ? '-' : ''}${symbol}${cr} Cr`;
    }
    if (abs >= 100000) {
      // 1 Lakh = 100,000
      const lk = (abs / 100000).toFixed(2).replace(/\.?0+$/, '');
      return `${isNegative ? '-' : ''}${symbol}${lk} L`;
    }
    if (abs >= 1000) {
      const k = (abs / 1000).toFixed(1).replace(/\.?0+$/, '');
      return `${isNegative ? '-' : ''}${symbol}${k}k`;
    }
    return `${isNegative ? '-' : ''}${symbol}${abs}`;
  }

  // Standard Western Millions / Billions
  if (abs >= 1000000000) {
    return `${isNegative ? '-' : ''}${symbol}${(abs / 1000000000).toFixed(1)}B`;
  }
  if (abs >= 1000000) {
    return `${isNegative ? '-' : ''}${symbol}${(abs / 1000000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${isNegative ? '-' : ''}${symbol}${(abs / 1000).toFixed(1)}K`;
  }
  return `${isNegative ? '-' : ''}${symbol}${abs}`;
}

/**
 * Extracts standard symbol for a currency code.
 */
export function getCurrencySymbol(currencyCode: string = 'INR', locale: string = 'en-IN'): string {
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(0);

    const symbolPart = formatted.find((part) => part.type === 'currency');
    return symbolPart ? symbolPart.value : currencyCode;
  } catch {
    return currencyCode === 'INR' ? '₹' : currencyCode;
  }
}

/**
 * Parses user input currency string into clean numeric value (stripping symbols and commas).
 */
export function parseCurrencyInput(input: string): number {
  if (!input || typeof input !== 'string') return 0;
  // Strip currency symbols and commas
  const clean = input.replace(/[^\d.-]/g, '').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a Date or ISO string into standard localized representation.
 */
export function formatLocalizedDate(
  date: Date | string,
  style: 'short' | 'medium' | 'long' = 'medium',
  locale: string = 'en-IN'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat(locale, { dateStyle: style }).format(d);
}
