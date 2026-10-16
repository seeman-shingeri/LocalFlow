import { Invoice, Customer } from '@/types/database';
import { formatCurrency, formatDate } from './utils';

export type OverdueAgingTier = 'courtesy' | 'firm' | 'urgent';

export interface InvoiceReminderMessage {
  tier: OverdueAgingTier;
  subject: string;
  body: string;
}

/**
 * Categorizes the overdue tier based on calendar days past due.
 */
export function getOverdueAgingTier(daysOverdue: number): OverdueAgingTier {
  if (daysOverdue <= 14) return 'courtesy';
  if (daysOverdue <= 30) return 'firm';
  return 'urgent';
}

/**
 * Generates structured escalation collection notices according to overdue duration.
 */
export function generateInvoiceReminderMessage(options: {
  invoice: Invoice;
  customer?: Customer | null;
  businessName?: string;
  daysOverdue: number;
  currency?: string;
}): InvoiceReminderMessage {
  const {
    invoice,
    customer,
    businessName = 'LocalFlow Rentals',
    daysOverdue,
    currency = 'USD',
  } = options;

  const clientName = customer?.name || invoice.customer?.name || 'Valued Client';
  const balanceFormatted = formatCurrency(invoice.balance_due, currency);
  const totalFormatted = formatCurrency(invoice.total_amount, currency);
  const dueDateFormatted = formatDate(invoice.due_date);
  const tier = getOverdueAgingTier(daysOverdue);

  if (tier === 'courtesy') {
    return {
      tier,
      subject: `Courtesy Reminder: Invoice ${invoice.invoice_number} from ${businessName}`,
      body: [
        `Dear ${clientName},`,
        ``,
        `We hope you are having a wonderful week!`,
        ``,
        `This is a friendly reminder that invoice ${invoice.invoice_number} for ${balanceFormatted} was due on ${dueDateFormatted} (${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} ago).`,
        ``,
        `If you have already initiated this payment, please disregard this note. Otherwise, we would appreciate it if you could remit payment at your earliest convenience.`,
        ``,
        `Invoice Summary:`,
        `• Invoice Number: ${invoice.invoice_number}`,
        `• Total Amount: ${totalFormatted}`,
        `• Remaining Balance: ${balanceFormatted}`,
        `• Due Date: ${dueDateFormatted}`,
        ``,
        `Thank you for choosing ${businessName}!`,
      ].join('\n'),
    };
  }

  if (tier === 'firm') {
    return {
      tier,
      subject: `Second Notice: Invoice ${invoice.invoice_number} is ${daysOverdue} Days Past Due`,
      body: [
        `Dear ${clientName},`,
        ``,
        `We are writing to follow up on our previous notice regarding invoice ${invoice.invoice_number}, which is now ${daysOverdue} days overdue.`,
        ``,
        `Outstanding Balance Due: ${balanceFormatted}`,
        `Original Due Date: ${dueDateFormatted}`,
        ``,
        `To ensure your account remains in good standing and to prevent holds on upcoming equipment rentals and scheduled bookings, please remit payment within 3 business days.`,
        ``,
        `If you are experiencing any billing discrepancies or need assistance with payment options, please contact us immediately.`,
        ``,
        `Sincerely,`,
        `Billing & Accounts Team`,
        `${businessName}`,
      ].join('\n'),
    };
  }

  // Urgent (31+ days)
  return {
    tier,
    subject: `URGENT NOTICE: Overdue Payment for Invoice ${invoice.invoice_number} (${daysOverdue} Days)`,
    body: [
      `ATTENTION: ${clientName}`,
      ``,
      `Your account shows an unresolved outstanding balance of ${balanceFormatted} for invoice ${invoice.invoice_number}, which is now ${daysOverdue} days past due (Due Date: ${dueDateFormatted}).`,
      ``,
      `Immediate action is required. Please remit full payment today or contact our finance department to arrange a settlement. Continued delay may result in suspension of rental privileges and referral for formal collection.`,
      ``,
      `Account Details:`,
      `• Invoice: ${invoice.invoice_number}`,
      `• Balance Due: ${balanceFormatted}`,
      `• Days Overdue: ${daysOverdue}`,
      ``,
      `Please reply to this email or call us directly upon sending payment so we can update your account.`,
      ``,
      `Urgent Collections Desk`,
      `${businessName}`,
    ].join('\n'),
  };
}
