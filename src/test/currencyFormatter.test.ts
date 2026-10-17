import { describe, it, expect } from 'vitest';
import {
  formatWorkspaceCurrency,
  formatCompactCurrency,
  getCurrencySymbol,
} from '@/lib/currencyFormatter';

describe('Workspace Currency Formatter (currencyFormatter)', () => {
  it('formats standard USD amounts with commas and 2 decimals', () => {
    const formatted = formatWorkspaceCurrency(1250.5, 'USD');
    expect(formatted).toBe('$1,250.50');
  });

  it('formats INR amounts using Indian locale grouping and rupee symbol', () => {
    const formatted = formatWorkspaceCurrency(150000, 'INR');
    expect(formatted).toContain('1,50,000.00');
    expect(formatted).toContain('₹');
  });

  it('formats EUR and GBP correctly', () => {
    expect(formatWorkspaceCurrency(100, 'GBP')).toBe('£100.00');
    expect(formatWorkspaceCurrency(100, 'EUR')).toContain('100,00');
  });

  it('returns compact notation for large values', () => {
    const compactUSD = formatCompactCurrency(2500, 'USD');
    expect(compactUSD).toMatch(/\$2\.5K/i);

    const compactLarge = formatCompactCurrency(1200000, 'USD');
    expect(compactLarge).toMatch(/\$1\.2M/i);
  });

  it('provides reliable symbol fallbacks', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencySymbol('GBP')).toBe('£');
    expect(getCurrencySymbol('EUR')).toBe('€');
    expect(getCurrencySymbol('UNKNOWN')).toBe('UNKNOWN');
  });

  it('handles null, undefined, or NaN safely', () => {
    expect(formatWorkspaceCurrency(null, 'USD')).toBe('$0.00');
    expect(formatWorkspaceCurrency(undefined, 'USD')).toBe('$0.00');
    expect(formatCompactCurrency(null, 'USD')).toBe('$0');
  });
});
