import { describe, it, expect } from 'vitest';
import { computePaymentMethodDistribution } from '@/lib/paymentAnalytics';
import { Payment } from '@/types/database';

describe('Payment Method Distribution Analytics (paymentAnalytics)', () => {
  const mockPayments: Payment[] = [
    {
      id: 'p-1',
      workspace_id: 'ws-1',
      invoice_id: 'inv-1',
      customer_id: 'cust-1',
      amount: 1500,
      payment_date: '2026-10-01',
      payment_method: 'card',
      transaction_reference: 'TX-1',
      notes: null,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'p-2',
      workspace_id: 'ws-1',
      invoice_id: 'inv-2',
      customer_id: 'cust-2',
      amount: 500,
      payment_date: '2026-10-02',
      payment_method: 'card',
      transaction_reference: 'TX-2',
      notes: null,
      created_at: '2026-10-02T00:00:00Z',
    },
    {
      id: 'p-3',
      workspace_id: 'ws-1',
      invoice_id: 'inv-3',
      customer_id: 'cust-3',
      amount: 3000,
      payment_date: '2026-10-03',
      payment_method: 'bank_transfer',
      transaction_reference: 'TX-3',
      notes: null,
      created_at: '2026-10-03T00:00:00Z',
    },
  ];

  it('calculates total collected, transaction count, and sorts methods by revenue', () => {
    // Total: $1500 + $500 + $3000 = $5000
    // Bank transfer: $3000 (60%, 1 txn, avg $3000)
    // Card: $2000 (40%, 2 txns, avg $1000)
    // Cash: $0
    // Other: $0
    const report = computePaymentMethodDistribution(mockPayments);

    expect(report.totalCollected).toBe(5000);
    expect(report.totalTransactions).toBe(3);

    // Rank 1: bank_transfer
    expect(report.methods[0].method).toBe('bank_transfer');
    expect(report.methods[0].totalAmount).toBe(3000);
    expect(report.methods[0].percentageOfRevenue).toBe(60);
    expect(report.methods[0].averageTicketSize).toBe(3000);

    // Rank 2: card
    expect(report.methods[1].method).toBe('card');
    expect(report.methods[1].totalAmount).toBe(2000);
    expect(report.methods[1].percentageOfRevenue).toBe(40);
    expect(report.methods[1].averageTicketSize).toBe(1000);
  });

  it('handles empty payments list without dividing by zero', () => {
    const report = computePaymentMethodDistribution([]);
    expect(report.totalCollected).toBe(0);
    expect(report.totalTransactions).toBe(0);
    expect(report.methods.every((m) => m.totalAmount === 0 && m.percentageOfRevenue === 0)).toBe(true);
  });
});
