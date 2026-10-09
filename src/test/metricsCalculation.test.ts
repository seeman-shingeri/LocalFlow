import { describe, it, expect } from 'vitest';

describe('Dashboard Metrics & KPI Arithmetic', () => {
  it('calculates conversion rate properly', () => {
    const totalDeals = 10;
    const convertedDeals = 3;
    const rate = Math.round((convertedDeals / totalDeals) * 100 * 10) / 10;
    expect(rate).toBe(30);
  });

  it('safely handles zero deals without dividing by zero', () => {
    const totalDeals = 0;
    const convertedDeals = 0;
    const rate = totalDeals > 0 ? (convertedDeals / totalDeals) * 100 : 0;
    expect(rate).toBe(0);
    expect(isNaN(rate)).toBe(false);
  });

  it('calculates outstanding balances strictly from unpaid amounts', () => {
    const invoices = [
      { total_amount: 500, paid_amount: 500, balance_due: 0, status: 'paid' },
      { total_amount: 1000, paid_amount: 400, balance_due: 600, status: 'partial' },
      { total_amount: 250, paid_amount: 0, balance_due: 250, status: 'sent' },
      { total_amount: 800, paid_amount: 0, balance_due: 800, status: 'cancelled' },
    ];

    const activeUnpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
    const totalOutstanding = activeUnpaid.reduce((sum, i) => sum + i.balance_due, 0);

    expect(totalOutstanding).toBe(850);
  });
});
