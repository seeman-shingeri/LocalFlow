import { describe, it, expect } from 'vitest';
import { calculatePaymentProgress } from '@/lib/invoiceProgress';

describe('Invoice Payment Progress & Status Badge Mapper (invoiceProgress)', () => {
  it('correctly calculates 100% full payment', () => {
    const res = calculatePaymentProgress(50000, 50000);

    expect(res.percentagePaid).toBe(100);
    expect(res.remainingBalance).toBe(0);
    expect(res.isFullyPaid).toBe(true);
    expect(res.variant).toBe('emerald');
    expect(res.label).toBe('Paid in Full');
  });

  it('correctly calculates partial payments and remaining balance', () => {
    const res = calculatePaymentProgress(100000, 40000);

    expect(res.percentagePaid).toBe(40);
    expect(res.remainingBalance).toBe(60000);
    expect(res.isPartiallyPaid).toBe(true);
    expect(res.isFullyPaid).toBe(false);
    expect(res.variant).toBe('amber');
    expect(res.label).toContain('40% Paid');
    expect(res.label).toContain('60,000 left');
  });

  it('handles completely unpaid invoices', () => {
    const res = calculatePaymentProgress(75000, 0);

    expect(res.percentagePaid).toBe(0);
    expect(res.remainingBalance).toBe(75000);
    expect(res.isUnpaid).toBe(true);
    expect(res.variant).toBe('rose');
    expect(res.label).toBe('Unpaid');
  });

  it('handles draft invoices with neutral styling', () => {
    const res = calculatePaymentProgress(50000, 0, true);

    expect(res.variant).toBe('slate');
    expect(res.label).toBe('Draft Invoice');
  });
});
