import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals, formatCurrency } from '../lib/utils';

describe('Invoice Math and Financial Calculations', () => {
  it('correctly calculates subtotal, tax, and total with standard line items', () => {
    const items = [
      { quantity: 2, unit_price: 100 }, // 200
      { quantity: 1, unit_price: 50 },  // 50
    ];
    const taxRate = 10; // 10%
    const totals = calculateInvoiceTotals(items, taxRate);

    expect(totals.subtotal).toBe(250.0);
    expect(totals.taxAmount).toBe(25.0);
    expect(totals.totalAmount).toBe(275.0);
  });

  it('handles zero tax rate correctly', () => {
    const items = [{ quantity: 3, unit_price: 45.5 }];
    const totals = calculateInvoiceTotals(items, 0);

    expect(totals.subtotal).toBe(136.5);
    expect(totals.taxAmount).toBe(0.0);
    expect(totals.totalAmount).toBe(136.5);
  });

  it('handles floating point precision safely', () => {
    const items = [
      { quantity: 1, unit_price: 19.99 },
      { quantity: 2, unit_price: 5.45 },
    ];
    // subtotal = 19.99 + 10.90 = 30.89
    // tax (8.25%) = 30.89 * 0.0825 = 2.548425 -> 2.55
    // total = 30.89 + 2.55 = 33.44
    const totals = calculateInvoiceTotals(items, 8.25);

    expect(totals.subtotal).toBe(30.89);
    expect(totals.taxAmount).toBe(2.55);
    expect(totals.totalAmount).toBe(33.44);
  });

  it('formats currency correctly without NaN', () => {
    expect(formatCurrency(1250.5, 'USD')).toBe('$1,250.50');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
    expect(formatCurrency(null, 'USD')).toBe('$0.00');
  });

  it('handles empty line items array gracefully', () => {
    const totals = calculateInvoiceTotals([], 10);
    expect(totals.subtotal).toBe(0);
    expect(totals.taxAmount).toBe(0);
    expect(totals.totalAmount).toBe(0);
  });
});
