import { describe, it, expect } from 'vitest';
import { getInvoiceHealthStatus } from '@/lib/invoiceHealth';
import { format, addDays, subDays } from 'date-fns';

describe('Invoice Health Status Evaluator (invoiceHealth)', () => {
  const today = new Date();

  it('marks paid or zero-balance invoices as settled', () => {
    const res = getInvoiceHealthStatus({
      status: 'paid',
      balance_due: 0,
      due_date: format(subDays(today, 10), 'yyyy-MM-dd'),
    });

    expect(res.tag).toBe('settled');
    expect(res.badgeVariant).toBe('success');
    expect(res.requiresAttention).toBe(false);
  });

  it('marks invoices due today with due_today tag and warning badge', () => {
    const res = getInvoiceHealthStatus({
      status: 'sent',
      balance_due: 500,
      due_date: format(today, 'yyyy-MM-dd'),
    });

    expect(res.tag).toBe('due_today');
    expect(res.label).toBe('Due Today');
    expect(res.requiresAttention).toBe(true);
  });

  it('marks invoices due within 48 hours as due_soon', () => {
    const res = getInvoiceHealthStatus({
      status: 'sent',
      balance_due: 500,
      due_date: format(addDays(today, 2), 'yyyy-MM-dd'),
    });

    expect(res.tag).toBe('due_soon');
    expect(res.badgeVariant).toBe('warning');
  });

  it('marks overdue invoices accurately with severe vs recent tags', () => {
    const recent = getInvoiceHealthStatus({
      status: 'sent',
      balance_due: 500,
      due_date: format(subDays(today, 5), 'yyyy-MM-dd'),
    });
    expect(recent.tag).toBe('overdue_recent');
    expect(recent.label).toBe('5d Overdue');
    expect(recent.badgeVariant).toBe('danger');

    const severe = getInvoiceHealthStatus({
      status: 'sent',
      balance_due: 500,
      due_date: format(subDays(today, 25), 'yyyy-MM-dd'),
    });
    expect(severe.tag).toBe('overdue_severe');
    expect(severe.label).toBe('25d Overdue');
    expect(severe.requiresAttention).toBe(true);
  });
});
