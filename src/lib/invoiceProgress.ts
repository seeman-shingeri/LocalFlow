export type PaymentProgressVariant = 'emerald' | 'amber' | 'rose' | 'slate';

export interface InvoicePaymentProgress {
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  percentagePaid: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  isUnpaid: boolean;
  variant: PaymentProgressVariant;
  label: string;
  ariaLabel: string;
}

/**
 * Computes payment progress percentage, remaining balance, and status badge styling.
 */
export function calculatePaymentProgress(
  total: number,
  paid: number,
  isDraft: boolean = false
): InvoicePaymentProgress {
  const safeTotal = Math.max(0, total);
  const safePaid = Math.max(0, paid);
  const remaining = Math.max(0, safeTotal - safePaid);

  if (isDraft) {
    return {
      totalAmount: safeTotal,
      paidAmount: safePaid,
      remainingBalance: remaining,
      percentagePaid: 0,
      isFullyPaid: false,
      isPartiallyPaid: false,
      isUnpaid: true,
      variant: 'slate',
      label: 'Draft Invoice',
      ariaLabel: 'Draft invoice with no payments recorded',
    };
  }

  if (safeTotal === 0) {
    return {
      totalAmount: 0,
      paidAmount: 0,
      remainingBalance: 0,
      percentagePaid: 100,
      isFullyPaid: true,
      isPartiallyPaid: false,
      isUnpaid: false,
      variant: 'emerald',
      label: 'Zero Balance / Complimentary',
      ariaLabel: 'Complimentary invoice with zero balance',
    };
  }

  const rawPercent = (safePaid / safeTotal) * 100;
  const percentagePaid = Math.min(100, Math.round(rawPercent));

  const isFullyPaid = safePaid >= safeTotal;
  const isPartiallyPaid = safePaid > 0 && !isFullyPaid;
  const isUnpaid = safePaid === 0;

  let variant: PaymentProgressVariant = 'rose';
  let label = 'Unpaid';

  if (isFullyPaid) {
    variant = 'emerald';
    label = 'Paid in Full';
  } else if (isPartiallyPaid) {
    variant = 'amber';
    label = `${percentagePaid}% Paid (₹${remaining.toLocaleString()} left)`;
  }

  const ariaLabel = `${percentagePaid}% paid, ₹${remaining.toLocaleString()} outstanding of ₹${safeTotal.toLocaleString()}`;

  return {
    totalAmount: safeTotal,
    paidAmount: safePaid,
    remainingBalance: remaining,
    percentagePaid,
    isFullyPaid,
    isPartiallyPaid,
    isUnpaid,
    variant,
    label,
    ariaLabel,
  };
}
