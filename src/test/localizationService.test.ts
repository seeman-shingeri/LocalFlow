import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCompactCurrency,
  getCurrencySymbol,
  parseCurrencyInput,
  formatLocalizedDate,
} from '@/lib/localizationService';

describe('Enterprise Date & Currency Localization Service (localizationService)', () => {
  it('formats Indian Rupee (INR) with Indian numbering grouping', () => {
    const formatted = formatCurrency(150000);
    // Should format with Rupee symbol and 1,50,000 grouping
    expect(formatted).toContain('1,50,000');
  });

  it('formats compact representations for Lakhs and Crores in INR', () => {
    expect(formatCompactCurrency(25000000)).toContain('2.5 Cr'); // 2.5 Crore
    expect(formatCompactCurrency(150000)).toContain('1.5 L');    // 1.5 Lakh
    expect(formatCompactCurrency(5000)).toContain('5k');
  });

  it('extracts currency symbols correctly', () => {
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencySymbol('USD', 'en-US')).toBe('$');
    expect(getCurrencySymbol('EUR', 'de-DE')).toBe('€');
  });

  it('parses formatted currency strings back to numeric amounts', () => {
    expect(parseCurrencyInput('₹1,50,000.50')).toBe(150000.5);
    expect(parseCurrencyInput('$ 12,450.00')).toBe(12450);
    expect(parseCurrencyInput('-₹500')).toBe(-500);
    expect(parseCurrencyInput('')).toBe(0);
  });

  it('formats localized dates accurately', () => {
    const date = '2026-11-18T10:00:00Z';
    const formatted = formatLocalizedDate(date, 'medium', 'en-IN');
    expect(formatted).toBeDefined();
    expect(formatted.length).toBeGreaterThan(0);
  });
});
