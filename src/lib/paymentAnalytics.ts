import { Payment, PaymentMethod } from '@/types/database';

export interface MethodBreakdown {
  method: PaymentMethod;
  label: string;
  totalAmount: number;
  transactionCount: number;
  averageTicketSize: number;
  percentageOfRevenue: number;
}

export interface PaymentMethodDistributionReport {
  totalCollected: number;
  totalTransactions: number;
  methods: MethodBreakdown[];
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Credit / Debit Card',
  bank_transfer: 'Bank Wire / ACH / Transfer',
  cash: 'Cash',
  other: 'Other / Cheque / Digital',
};

/**
 * Aggregates payments by method and computes revenue volume, transaction counts, and ticket averages.
 */
export function computePaymentMethodDistribution(payments: Payment[] = []): PaymentMethodDistributionReport {
  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalTransactions = payments.length;

  const methodBuckets: Record<PaymentMethod, { amount: number; count: number }> = {
    card: { amount: 0, count: 0 },
    bank_transfer: { amount: 0, count: 0 },
    cash: { amount: 0, count: 0 },
    other: { amount: 0, count: 0 },
  };

  payments.forEach((p) => {
    const m = (p.payment_method || 'other') as PaymentMethod;
    const bucket = methodBuckets[m] || methodBuckets.other;
    bucket.amount += Number(p.amount) || 0;
    bucket.count += 1;
  });

  const methods: MethodBreakdown[] = (Object.keys(methodBuckets) as PaymentMethod[]).map((method) => {
    const stats = methodBuckets[method];
    const avgTicket = stats.count > 0 ? stats.amount / stats.count : 0;
    const pct = totalCollected > 0 ? (stats.amount / totalCollected) * 100 : 0;

    return {
      method,
      label: METHOD_LABELS[method] || method,
      totalAmount: Math.round(stats.amount * 100) / 100,
      transactionCount: stats.count,
      averageTicketSize: Math.round(avgTicket * 100) / 100,
      percentageOfRevenue: Math.round(pct * 10) / 10,
    };
  });

  // Sort by highest collected amount descending
  methods.sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalTransactions,
    methods,
  };
}
