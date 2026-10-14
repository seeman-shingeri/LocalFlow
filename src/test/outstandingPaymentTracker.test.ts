import { describe, it, expect } from 'vitest';
import { calculateOutstandingAging } from '../lib/paymentAging';
import { Invoice } from '../types/database';
import { subDays, addDays, format } from 'date-fns';

describe('Outstanding Payment Tracker & Aging Analysis', () => {
  const asOf = new Date('2026-10-15T12:00:00Z');
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  const makeInvoice = (overrides: Partial<Invoice>): Invoice => ({
    id: overrides.id || 'inv-test-1',
    workspace_id: 'ws-test',
    customer_id: 'cust-1',
    invoice_number: overrides.invoice_number || 'INV-001',
    issue_date: fmt(subDays(asOf, 30)),
    due_date: overrides.due_date || fmt(asOf),
    subtotal: 1000,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: overrides.total_amount ?? 1000,
    paid_amount: overrides.paid_amount ?? 0,
    balance_due: overrides.balance_due ?? 1000,
    status: overrides.status || 'sent',
    notes: null,
    terms: 'Net 30',
    created_at: fmt(subDays(asOf, 30)),
    updated_at: fmt(subDays(asOf, 30)),
    ...overrides,
  });

  it('correctly categorizes invoices into aging buckets', () => {
    const invoices: Invoice[] = [
      // 1. Current / Not overdue (due in 5 days)
      makeInvoice({
        id: 'inv-curr',
        invoice_number: 'INV-CURR',
        due_date: fmt(addDays(asOf, 5)),
        balance_due: 500,
        status: 'sent',
      }),
      // 2. 1-15 days overdue (due 7 days ago)
      makeInvoice({
        id: 'inv-15',
        invoice_number: 'INV-15',
        due_date: fmt(subDays(asOf, 7)),
        balance_due: 800,
        status: 'overdue',
      }),
      // 3. 16-30 days overdue (due 22 days ago)
      makeInvoice({
        id: 'inv-30',
        invoice_number: 'INV-30',
        due_date: fmt(subDays(asOf, 22)),
        balance_due: 1200,
        status: 'overdue',
      }),
      // 4. 30+ days overdue (due 45 days ago)
      makeInvoice({
        id: 'inv-45',
        invoice_number: 'INV-45',
        due_date: fmt(subDays(asOf, 45)),
        balance_due: 2500,
        status: 'overdue',
      }),
    ];

    const report = calculateOutstandingAging(invoices, asOf);

    expect(report.totalOutstanding).toBe(5000); // 500 + 800 + 1200 + 2500
    expect(report.currentAmount).toBe(500);
    expect(report.overdue1to15Amount).toBe(800);
    expect(report.overdue16to30Amount).toBe(1200);
    expect(report.overdue30PlusAmount).toBe(2500);
    expect(report.totalOverdueCount).toBe(3);

    // Verify individual items
    const currItem = report.items.find((i) => i.invoice.id === 'inv-curr');
    expect(currItem?.agingBucket).toBe('current');
    expect(currItem?.daysOverdue).toBe(0);

    const item15 = report.items.find((i) => i.invoice.id === 'inv-15');
    expect(item15?.agingBucket).toBe('1-15');
    expect(item15?.daysOverdue).toBe(7);

    const item30 = report.items.find((i) => i.invoice.id === 'inv-30');
    expect(item30?.agingBucket).toBe('16-30');
    expect(item30?.daysOverdue).toBe(22);

    const item45 = report.items.find((i) => i.invoice.id === 'inv-45');
    expect(item45?.agingBucket).toBe('30+');
    expect(item45?.daysOverdue).toBe(45);
  });

  it('excludes paid, draft, or cancelled invoices from aging tracking', () => {
    const invoices: Invoice[] = [
      makeInvoice({
        id: 'inv-paid',
        status: 'paid',
        balance_due: 0,
        due_date: fmt(subDays(asOf, 20)),
      }),
      makeInvoice({
        id: 'inv-draft',
        status: 'draft',
        balance_due: 1000,
        due_date: fmt(subDays(asOf, 20)),
      }),
      makeInvoice({
        id: 'inv-cancelled',
        status: 'cancelled',
        balance_due: 1000,
        due_date: fmt(subDays(asOf, 20)),
      }),
      makeInvoice({
        id: 'inv-valid',
        status: 'sent',
        balance_due: 450,
        due_date: fmt(subDays(asOf, 5)),
      }),
    ];

    const report = calculateOutstandingAging(invoices, asOf);
    expect(report.items).toHaveLength(1);
    expect(report.items[0].invoice.id).toBe('inv-valid');
    expect(report.totalOutstanding).toBe(450);
  });

  it('orders outstanding items by highest days overdue first', () => {
    const invoices: Invoice[] = [
      makeInvoice({ id: 'inv-1', due_date: fmt(subDays(asOf, 5)), balance_due: 100 }),
      makeInvoice({ id: 'inv-2', due_date: fmt(subDays(asOf, 40)), balance_due: 200 }),
      makeInvoice({ id: 'inv-3', due_date: fmt(subDays(asOf, 12)), balance_due: 300 }),
    ];

    const report = calculateOutstandingAging(invoices, asOf);
    expect(report.items[0].invoice.id).toBe('inv-2'); // 40 days overdue
    expect(report.items[1].invoice.id).toBe('inv-3'); // 12 days overdue
    expect(report.items[2].invoice.id).toBe('inv-1'); // 5 days overdue
  });
});
