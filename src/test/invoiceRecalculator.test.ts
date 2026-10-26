import { describe, it, expect } from 'vitest';
import { recalculateInvoice, InvoiceLineItemInput } from '@/lib/invoiceRecalculator';

describe('Multi-Item Invoice Subtotal & Discount Line Recalculator (invoiceRecalculator)', () => {
  it('correctly calculates line-item taxes and totals with percentage discounts', () => {
    const items: InvoiceLineItemInput[] = [
      {
        description: 'Shamiyana German Hangar',
        quantity: 2,
        unitPrice: 20000, // 40000 gross
        discountType: 'percentage',
        discountValue: 10, // 10% = 4000 disc => 36000 taxable
        taxRate: 18, // 18% of 36000 = 6480 tax => 42480 line total
      },
      {
        description: 'VIP Sofas',
        quantity: 10,
        unitPrice: 1500, // 15000 gross
        discountType: 'fixed',
        discountValue: 1000, // 1000 disc => 14000 taxable
        taxRate: 12, // 12% of 14000 = 1680 tax => 15680 line total
      },
    ];

    const result = recalculateInvoice(items, { transportationFee: 2500 });

    expect(result.itemsGrossSubtotal).toBe(55000);
    expect(result.itemsDiscountTotal).toBe(5000);
    expect(result.itemsTaxableSubtotal).toBe(50000);
    expect(result.itemsTaxTotal).toBe(8160); // 6480 + 1680
    expect(result.transportationFee).toBe(2500);

    // Grand total = 50000 (taxable) + 8160 (tax) + 2500 (transport) = 60660
    expect(result.grandTotal).toBe(60660);
    expect(result.lineItems[0].totalAmount).toBe(42480);
    expect(result.lineItems[1].totalAmount).toBe(15680);
  });

  it('applies global invoice header discounts properly', () => {
    const items: InvoiceLineItemInput[] = [
      {
        description: 'Stage lighting',
        quantity: 1,
        unitPrice: 10000,
        taxRate: 0,
      },
    ];

    const result = recalculateInvoice(items, {
      globalDiscountType: 'fixed',
      globalDiscountValue: 1500,
    });

    expect(result.globalDiscountAmount).toBe(1500);
    expect(result.grandTotal).toBe(8500);
  });
});
