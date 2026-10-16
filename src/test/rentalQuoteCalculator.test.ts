import { describe, it, expect } from 'vitest';
import {
  calculateRentalQuote,
  formatRentalQuoteText,
  RentalQuoteItemInput,
} from '@/lib/rentalQuoteCalculator';

describe('Rental Quote & Estimate Calculator', () => {
  const items: RentalQuoteItemInput[] = [
    {
      name: 'Waterproof Shamiyana Marquee (40x60 ft)',
      quantity: 2,
      rentalRatePerDay: 350.0,
    },
    {
      name: 'Galvanized Steel Poles (20ft)',
      quantity: 12,
      rentalRatePerDay: 15.0,
    },
    {
      name: 'White Padded Banquet Chairs',
      quantity: 100,
      rentalRatePerDay: 3.5,
    },
  ];

  it('calculates single-day rental price accurately', () => {
    // 2 * 350 * 1 = 700
    // 12 * 15 * 1 = 180
    // 100 * 3.5 * 1 = 350
    // Subtotal = 1230.00
    const quote = calculateRentalQuote({
      items,
      durationDays: 1,
    });

    expect(quote.durationDays).toBe(1);
    expect(quote.equipmentSubtotal).toBe(1230.0);
    expect(quote.discountAmount).toBe(0);
    expect(quote.discountedSubtotal).toBe(1230.0);
    expect(quote.totalRentalPrice).toBe(1230.0);
    expect(quote.grandTotalWithDeposit).toBe(1230.0);
  });

  it('multiplies line items by multi-day duration and applies discounts', () => {
    // Duration: 3 days
    // 2 * 350 * 3 = 2100
    // 12 * 15 * 3 = 540
    // 100 * 3.5 * 3 = 1050
    // Equipment Subtotal = 3690.00
    // 10% discount = 369.00 -> Discounted Subtotal = 3321.00
    const quote = calculateRentalQuote({
      items,
      durationDays: 3,
      discountPercent: 10,
    });

    expect(quote.durationDays).toBe(3);
    expect(quote.equipmentSubtotal).toBe(3690.0);
    expect(quote.discountAmount).toBe(369.0);
    expect(quote.discountedSubtotal).toBe(3321.0);
    expect(quote.totalRentalPrice).toBe(3321.0);
  });

  it('calculates tax, delivery fee, and security deposit correctly', () => {
    // 1 day = 1230.00 equipment subtotal
    // Delivery fee = 250.00
    // Taxable amount = 1230.00 + 250.00 = 1480.00
    // Tax 10% = 148.00
    // Total Rental Price = 1230 + 250 + 148 = 1628.00
    // Security deposit 20% on equipment = 246.00
    // Grand Total with Deposit = 1628 + 246 = 1874.00
    const quote = calculateRentalQuote({
      items,
      durationDays: 1,
      deliveryAndSetupFee: 250.0,
      taxRatePercent: 10,
      securityDepositPercent: 20,
    });

    expect(quote.equipmentSubtotal).toBe(1230.0);
    expect(quote.deliveryAndSetupFee).toBe(250.0);
    expect(quote.taxAmount).toBe(148.0);
    expect(quote.totalRentalPrice).toBe(1628.0);
    expect(quote.securityDepositAmount).toBe(246.0);
    expect(quote.grandTotalWithDeposit).toBe(1874.0);
  });

  it('formats clean quotation text for clients', () => {
    const quote = calculateRentalQuote({
      items: [
        {
          name: 'Waterproof Shamiyana Marquee (40x60 ft)',
          quantity: 1,
          rentalRatePerDay: 350.0,
        },
      ],
      durationDays: 2,
      deliveryAndSetupFee: 100,
      taxRatePercent: 10,
    });

    const text = formatRentalQuoteText(quote, 'Heritage Club & Resort');
    expect(text).toContain('RENTAL ESTIMATE & QUOTATION');
    expect(text).toContain('Prepared for: Heritage Club & Resort');
    expect(text).toContain('Rental Duration: 2 days');
    expect(text).toContain('Waterproof Shamiyana Marquee (40x60 ft)');
    expect(text).toContain('Equipment Subtotal: $700.00');
    expect(text).toContain('Delivery & Rigging: $100.00');
    expect(text).toContain('Sales Tax: $80.00');
    expect(text).toContain('Total Rental Price: $880.00');
  });

  it('safely handles empty item lists and invalid durations', () => {
    const quote = calculateRentalQuote({
      items: [],
      durationDays: -5, // clamped to 1
      discountPercent: -20, // clamped to 0
    });

    expect(quote.durationDays).toBe(1);
    expect(quote.equipmentSubtotal).toBe(0);
    expect(quote.totalRentalPrice).toBe(0);
  });
});
