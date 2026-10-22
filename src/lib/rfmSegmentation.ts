import { Invoice, Appointment } from '@/types/database';
import { differenceInDays, parseISO } from 'date-fns';

export type RfmSegment =
  | 'Champions'
  | 'Loyal Customers'
  | 'Potential Loyalists'
  | 'Recent Customers'
  | 'At Risk'
  | 'Lost';

export interface RfmScoreResult {
  recencyScore: number; // 1-5 (5 = most recent)
  frequencyScore: number; // 1-5 (5 = most frequent)
  monetaryScore: number; // 1-5 (5 = highest spender)
  combinedRfmString: string; // e.g. "555", "432"
  segment: RfmSegment;
  totalSpend: number;
  completedTransactionsCount: number;
  daysSinceLastActivity: number;
}

/**
 * Calculates Recency, Frequency, Monetary (RFM) score and behavioral segment for a client.
 */
export function calculateCustomerRfm(options: {
  customerId: string;
  invoices: Invoice[];
  appointments: Appointment[];
  asOfDate?: Date;
}): RfmScoreResult {
  const { customerId, invoices = [], appointments = [], asOfDate = new Date() } = options;

  const customerInvoices = invoices.filter((inv) => inv.customer_id === customerId);
  const customerAppointments = appointments.filter(
    (apt) => apt.customer_id === customerId && apt.status === 'completed'
  );

  // Total Monetary
  const totalSpend = customerInvoices.reduce(
    (sum, inv) => sum + (Number(inv.paid_amount) || 0),
    0
  );

  // Frequency
  const paidInvoiceCount = customerInvoices.filter(
    (inv) => inv.status === 'paid' || (Number(inv.paid_amount) || 0) > 0
  ).length;
  const frequencyCount = Math.max(paidInvoiceCount, customerAppointments.length);

  // Recency: find most recent timestamp among invoices & appointments
  const allTimestamps: Date[] = [];
  customerInvoices.forEach((inv) => {
    try {
      allTimestamps.push(parseISO(inv.issue_date || inv.created_at));
    } catch {}
  });
  customerAppointments.forEach((apt) => {
    try {
      allTimestamps.push(parseISO(apt.end_time || apt.start_time));
    } catch {}
  });

  let daysSinceLast = 999;
  if (allTimestamps.length > 0) {
    const latest = new Date(Math.max(...allTimestamps.map((d) => d.getTime())));
    daysSinceLast = Math.max(0, differenceInDays(asOfDate, latest));
  }

  // 1. Recency Score (1-5)
  let recency = 1;
  if (daysSinceLast <= 30) recency = 5;
  else if (daysSinceLast <= 60) recency = 4;
  else if (daysSinceLast <= 90) recency = 3;
  else if (daysSinceLast <= 180) recency = 2;

  // 2. Frequency Score (1-5)
  let frequency = 1;
  if (frequencyCount >= 5) frequency = 5;
  else if (frequencyCount >= 4) frequency = 4;
  else if (frequencyCount >= 3) frequency = 3;
  else if (frequencyCount >= 2) frequency = 2;
  else if (frequencyCount === 1) frequency = 1;

  // 3. Monetary Score (1-5)
  let monetary = 1;
  if (totalSpend >= 5000) monetary = 5;
  else if (totalSpend >= 3000) monetary = 4;
  else if (totalSpend >= 1500) monetary = 3;
  else if (totalSpend >= 500) monetary = 2;

  // Segment classification
  let segment: RfmSegment = 'Lost';

  if (recency >= 4 && frequency >= 4 && monetary >= 4) {
    segment = 'Champions';
  } else if (recency <= 2 && (frequency >= 3 || monetary >= 3)) {
    segment = 'At Risk';
  } else if (frequency >= 3 && monetary >= 3) {
    segment = 'Loyal Customers';
  } else if (recency >= 4 && frequency <= 2) {
    segment = 'Recent Customers';
  } else if (recency >= 3 && frequency >= 2) {
    segment = 'Potential Loyalists';
  } else {
    segment = 'Lost';
  }

  return {
    recencyScore: recency,
    frequencyScore: frequency,
    monetaryScore: monetary,
    combinedRfmString: `${recency}${frequency}${monetary}`,
    segment,
    totalSpend: Math.round(totalSpend * 100) / 100,
    completedTransactionsCount: frequencyCount,
    daysSinceLastActivity: daysSinceLast,
  };
}
