import { describe, it, expect } from 'vitest';
import {
  getRentalDurationDiscountTier,
  applyRentalDurationDiscount,
} from '@/lib/rentalDiscountRules';

describe('Rental Duration Discount Tier Rules (rentalDiscountRules)', () => {
  it('applies 0% standard rate for 1 or 2 day rentals', () => {
    const tier1 = getRentalDurationDiscountTier(1);
    expect(tier1.discountPercent).toBe(0);

    const calc = applyRentalDurationDiscount(1000, 2);
    expect(calc.discountPercent).toBe(0);
    expect(calc.discountAmount).toBe(0);
    expect(calc.finalTotal).toBe(1000);
  });

  it('applies 10% multi-day discount for 3 to 6 day rentals', () => {
    const tier = getRentalDurationDiscountTier(4);
    expect(tier.discountPercent).toBe(10);
    expect(tier.tierLabel).toBe('Multi-Day Festival');

    const calc = applyRentalDurationDiscount(2000, 5);
    expect(calc.discountAmount).toBe(200); // 10% of 2000
    expect(calc.finalTotal).toBe(1800);
    expect(calc.savingsSummary).toContain('Saved $200.00');
  });

  it('applies 20% weekly discount for 7 to 13 day rentals', () => {
    const tier = getRentalDurationDiscountTier(7);
    expect(tier.discountPercent).toBe(20);
    expect(tier.tierLabel).toBe('Weekly Package');

    const calc = applyRentalDurationDiscount(3500, 10);
    expect(calc.discountAmount).toBe(700); // 20% of 3500
    expect(calc.finalTotal).toBe(2800);
  });

  it('applies 30% long-term contract discount for 14+ day rentals', () => {
    const tier = getRentalDurationDiscountTier(30);
    expect(tier.discountPercent).toBe(30);
    expect(tier.tierLabel).toBe('Long-Term Contract');

    const calc = applyRentalDurationDiscount(10000, 14);
    expect(calc.discountAmount).toBe(3000);
    expect(calc.finalTotal).toBe(7000);
  });
});
