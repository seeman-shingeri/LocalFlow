import { describe, it, expect } from 'vitest';
import { calculateCustomerRfm } from '@/lib/rfmSegmentation';
import { Invoice, Appointment } from '@/types/database';
import { subDays } from 'date-fns';

describe('Customer Lifetime Value & RFM Segmentation (rfmSegmentation)', () => {
  const asOfDate = new Date(2026, 9, 22);

  it('classifies high-spend, frequent, recent customers as Champions', () => {
    const customerId = 'cust-champ';

    // 5 invoices totaling $6000, last invoice 5 days ago
    const invoices: Invoice[] = [1, 2, 3, 4, 5].map((i) => ({
      id: `inv-${i}`,
      workspace_id: 'ws-1',
      customer_id: customerId,
      invoice_number: `INV-00${i}`,
      issue_date: subDays(asOfDate, i * 3).toISOString().slice(0, 10),
      due_date: subDays(asOfDate, i * 3).toISOString().slice(0, 10),
      subtotal: 1200,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 1200,
      paid_amount: 1200,
      balance_due: 0,
      status: 'paid',
      notes: null,
      terms: null,
      created_at: subDays(asOfDate, i * 3).toISOString(),
      updated_at: subDays(asOfDate, i * 3).toISOString(),
    }));

    const rfm = calculateCustomerRfm({
      customerId,
      invoices,
      appointments: [],
      asOfDate,
    });

    expect(rfm.recencyScore).toBe(5);
    expect(rfm.frequencyScore).toBe(5);
    expect(rfm.monetaryScore).toBe(5);
    expect(rfm.combinedRfmString).toBe('555');
    expect(rfm.segment).toBe('Champions');
    expect(rfm.totalSpend).toBe(6000);
  });

  it('flags historically frequent customers with no recent activity as At Risk', () => {
    const customerId = 'cust-dormant';

    // 4 invoices, but last one was 120 days ago
    const invoices: Invoice[] = [1, 2, 3, 4].map((i) => ({
      id: `inv-${i}`,
      workspace_id: 'ws-1',
      customer_id: customerId,
      invoice_number: `INV-00${i}`,
      issue_date: subDays(asOfDate, 120 + i * 10).toISOString().slice(0, 10),
      due_date: subDays(asOfDate, 120 + i * 10).toISOString().slice(0, 10),
      subtotal: 400,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 400,
      paid_amount: 400,
      balance_due: 0,
      status: 'paid',
      notes: null,
      terms: null,
      created_at: subDays(asOfDate, 120 + i * 10).toISOString(),
      updated_at: subDays(asOfDate, 120 + i * 10).toISOString(),
    }));

    const rfm = calculateCustomerRfm({
      customerId,
      invoices,
      appointments: [],
      asOfDate,
    });

    expect(rfm.recencyScore).toBeLessThanOrEqual(2);
    expect(rfm.frequencyScore).toBeGreaterThanOrEqual(3);
    expect(rfm.segment).toBe('At Risk');
  });

  it('handles customers with no transaction history as Lost/Inactive', () => {
    const rfm = calculateCustomerRfm({
      customerId: 'cust-empty',
      invoices: [],
      appointments: [],
      asOfDate,
    });

    expect(rfm.recencyScore).toBe(1);
    expect(rfm.frequencyScore).toBe(1);
    expect(rfm.monetaryScore).toBe(1);
    expect(rfm.segment).toBe('Lost');
    expect(rfm.totalSpend).toBe(0);
  });
});
