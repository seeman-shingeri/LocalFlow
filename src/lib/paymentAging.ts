import { Invoice } from '@/types/database';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

export type AgingBucket = 'current' | '1-15' | '16-30' | '30+';

export interface OutstandingInvoiceItem {
  invoice: Invoice;
  daysOverdue: number;
  agingBucket: AgingBucket;
}

export interface OutstandingAgingReport {
  totalOutstanding: number;
  currentAmount: number;
  overdue1to15Amount: number;
  overdue16to30Amount: number;
  overdue30PlusAmount: number;
  totalOverdueCount: number;
  items: OutstandingInvoiceItem[];
}

export function calculateOutstandingAging(
  invoices: Invoice[],
  asOfDate: Date = new Date()
): OutstandingAgingReport {
  const today = startOfDay(asOfDate);

  // Consider unpaid invoices with a positive balance_due
  const unpaid = invoices.filter(
    (inv) =>
      inv.status !== 'paid' &&
      inv.status !== 'cancelled' &&
      inv.status !== 'draft' &&
      Number(inv.balance_due) > 0
  );

  let currentAmount = 0;
  let overdue1to15Amount = 0;
  let overdue16to30Amount = 0;
  let overdue30PlusAmount = 0;
  let totalOverdueCount = 0;

  const items: OutstandingInvoiceItem[] = unpaid.map((invoice) => {
    const dueDate = startOfDay(parseISO(invoice.due_date));
    const diff = differenceInCalendarDays(today, dueDate);

    let agingBucket: AgingBucket;
    let daysOverdue = 0;

    if (diff <= 0) {
      agingBucket = 'current';
      daysOverdue = 0;
      currentAmount += Number(invoice.balance_due);
    } else if (diff <= 15) {
      agingBucket = '1-15';
      daysOverdue = diff;
      overdue1to15Amount += Number(invoice.balance_due);
      totalOverdueCount += 1;
    } else if (diff <= 30) {
      agingBucket = '16-30';
      daysOverdue = diff;
      overdue16to30Amount += Number(invoice.balance_due);
      totalOverdueCount += 1;
    } else {
      agingBucket = '30+';
      daysOverdue = diff;
      overdue30PlusAmount += Number(invoice.balance_due);
      totalOverdueCount += 1;
    }

    return {
      invoice,
      daysOverdue,
      agingBucket,
    };
  });

  // Sort items: most days overdue first, then highest balance_due
  items.sort((a, b) => {
    if (b.daysOverdue !== a.daysOverdue) {
      return b.daysOverdue - a.daysOverdue;
    }
    return Number(b.invoice.balance_due) - Number(a.invoice.balance_due);
  });

  const totalOutstanding =
    Math.round(
      (currentAmount + overdue1to15Amount + overdue16to30Amount + overdue30PlusAmount) * 100
    ) / 100;

  return {
    totalOutstanding,
    currentAmount: Math.round(currentAmount * 100) / 100,
    overdue1to15Amount: Math.round(overdue1to15Amount * 100) / 100,
    overdue16to30Amount: Math.round(overdue16to30Amount * 100) / 100,
    overdue30PlusAmount: Math.round(overdue30PlusAmount * 100) / 100,
    totalOverdueCount,
    items,
  };
}
