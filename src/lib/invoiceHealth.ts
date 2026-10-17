import { parseISO, startOfDay, differenceInCalendarDays } from 'date-fns';

export type InvoiceHealthTag =
  | 'settled'
  | 'overdue_severe'
  | 'overdue_recent'
  | 'due_today'
  | 'due_soon'
  | 'upcoming';

export interface InvoiceHealthInfo {
  tag: InvoiceHealthTag;
  label: string;
  daysDifference: number; // positive = days until due, negative = days past due
  badgeVariant: 'success' | 'danger' | 'warning' | 'default';
  requiresAttention: boolean;
}

/**
 * Categorizes an invoice's due date proximity into actionable health tags.
 */
export function getInvoiceHealthStatus(invoice: {
  status: string;
  balance_due: number;
  due_date: string;
}): InvoiceHealthInfo {
  // If paid or cancelled, or balance is 0, it is settled
  if (
    invoice.status === 'paid' ||
    invoice.status === 'cancelled' ||
    (Number(invoice.balance_due) || 0) <= 0
  ) {
    return {
      tag: 'settled',
      label: 'Settled',
      daysDifference: 0,
      badgeVariant: 'success',
      requiresAttention: false,
    };
  }

  let daysDiff = 0;
  try {
    const today = startOfDay(new Date());
    const dueDate = startOfDay(parseISO(invoice.due_date));
    daysDiff = differenceInCalendarDays(dueDate, today);
  } catch {
    daysDiff = 0;
  }

  if (daysDiff < -14) {
    return {
      tag: 'overdue_severe',
      label: `${Math.abs(daysDiff)}d Overdue`,
      daysDifference: daysDiff,
      badgeVariant: 'danger',
      requiresAttention: true,
    };
  }

  if (daysDiff < 0) {
    return {
      tag: 'overdue_recent',
      label: `${Math.abs(daysDiff)}d Overdue`,
      daysDifference: daysDiff,
      badgeVariant: 'danger',
      requiresAttention: true,
    };
  }

  if (daysDiff === 0) {
    return {
      tag: 'due_today',
      label: 'Due Today',
      daysDifference: 0,
      badgeVariant: 'warning',
      requiresAttention: true,
    };
  }

  if (daysDiff <= 2) {
    return {
      tag: 'due_soon',
      label: `Due in ${daysDiff}d`,
      daysDifference: daysDiff,
      badgeVariant: 'warning',
      requiresAttention: false,
    };
  }

  return {
    tag: 'upcoming',
    label: `Due in ${daysDiff}d`,
    daysDifference: daysDiff,
    badgeVariant: 'default',
    requiresAttention: false,
  };
}
