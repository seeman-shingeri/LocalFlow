import { describe, it, expect } from 'vitest';
import { calculateTaxBreakdown, TaxRateItem } from '@/lib/taxBreakdown';

describe('Multi-Rate Invoice Tax Breakdown (taxBreakdown)', () => {
  it('computes composite multi-rate taxes accurately', () => {
    // Subtotal: $1,000.00
    // State Tax: 6.25% ($62.50)
    // City Tax: 2.00% ($20.00)
    // Total Tax: $82.50, Grand Total: $1,082.50
    const rates: TaxRateItem[] = [
      { label: 'State Sales Tax', ratePercent: 6.25 },
      { label: 'City Municipal Tax', ratePercent: 2.0 },
    ];

    const res = calculateTaxBreakdown(1000, rates);

    expect(res.grossSubtotal).toBe(1000);
    expect(res.totalTaxAmount).toBe(82.5);
    expect(res.grandTotal).toBe(1082.5);
    expect(res.effectiveTaxRatePercent).toBe(8.25);
    expect(res.components).toHaveLength(2);
    expect(res.components[0].taxAmount).toBe(62.5);
    expect(res.components[1].taxAmount).toBe(20.0);
  });

  it('honors partial tax exemptions on specific levies', () => {
    // Subtotal $1,000, but $200 is exempt from Luxury Event Tax (rate applies only to $800)
    const rates: TaxRateItem[] = [
      { label: 'Standard VAT', ratePercent: 10, exemptAmount: 0 },
      { label: 'Luxury Tent Tax', ratePercent: 5, exemptAmount: 200 },
    ];

    const res = calculateTaxBreakdown(1000, rates);
    // Standard VAT: 10% of 1000 = 100
    // Luxury Tent Tax: 5% of 800 = 40
    expect(res.totalTaxAmount).toBe(140);
    expect(res.components[1].taxableAmount).toBe(800);
    expect(res.components[1].taxAmount).toBe(40);
    expect(res.grandTotal).toBe(1140);
  });

  it('handles empty tax rates or zero subtotal gracefully', () => {
    const res = calculateTaxBreakdown(0, []);
    expect(res.totalTaxAmount).toBe(0);
    expect(res.grandTotal).toBe(0);
    expect(res.effectiveTaxRatePercent).toBe(0);
  });
});
