import { Enquiry, Appointment, Invoice, FollowUp, Payment } from '@/types/database';
import { parseISO } from 'date-fns';

export type TimelineEventType =
  | 'enquiry_created'
  | 'followup_pending'
  | 'followup_completed'
  | 'appointment_scheduled'
  | 'appointment_completed'
  | 'invoice_issued'
  | 'payment_received';

export interface TimelineItem {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  statusBadge?: string;
  amount?: number;
}

/**
 * Consolidates customer touchpoints into a unified chronological activity timeline.
 */
export function buildCustomerActivityTimeline(options: {
  customerId: string;
  enquiries?: Enquiry[];
  appointments?: Appointment[];
  invoices?: Invoice[];
  followUps?: FollowUp[];
  payments?: Payment[];
}): TimelineItem[] {
  const { customerId, enquiries = [], appointments = [], invoices = [], followUps = [], payments = [] } = options;
  const items: TimelineItem[] = [];

  // 1. Enquiries
  enquiries
    .filter((e) => e.customer_id === customerId)
    .forEach((e) => {
      items.push({
        id: `enq-${e.id}`,
        type: 'enquiry_created',
        title: `Enquiry: ${e.title}`,
        description: `Stage: ${e.status} | Value: $${(Number(e.estimated_value) || 0).toFixed(2)}`,
        timestamp: e.created_at,
        statusBadge: e.status,
        amount: Number(e.estimated_value) || 0,
      });
    });

  // 2. Appointments
  appointments
    .filter((a) => a.customer_id === customerId)
    .forEach((a) => {
      items.push({
        id: `apt-${a.id}`,
        type: a.status === 'completed' ? 'appointment_completed' : 'appointment_scheduled',
        title: `Event: ${a.title}`,
        description: `Status: ${a.status} | Location: ${a.location || 'Not specified'}`,
        timestamp: a.start_time,
        statusBadge: a.status,
      });
    });

  // 3. Invoices
  invoices
    .filter((inv) => inv.customer_id === customerId)
    .forEach((inv) => {
      items.push({
        id: `inv-${inv.id}`,
        type: 'invoice_issued',
        title: `Invoice ${inv.invoice_number}`,
        description: `Total: $${Number(inv.total_amount).toFixed(2)} | Balance: $${Number(inv.balance_due).toFixed(2)}`,
        timestamp: inv.created_at || inv.issue_date,
        statusBadge: inv.status,
        amount: Number(inv.total_amount) || 0,
      });
    });

  // 4. Payments
  payments
    .filter((p) => p.customer_id === customerId)
    .forEach((p) => {
      items.push({
        id: `pmt-${p.id}`,
        type: 'payment_received',
        title: `Payment Received: $${Number(p.amount).toFixed(2)}`,
        description: `Method: ${p.payment_method} | Ref: ${p.transaction_reference || 'N/A'}`,
        timestamp: p.payment_date || p.created_at,
        statusBadge: 'completed',
        amount: Number(p.amount) || 0,
      });
    });

  // 5. Follow-ups
  followUps
    .filter((f) => f.customer_id === customerId)
    .forEach((f) => {
      items.push({
        id: `flw-${f.id}`,
        type: f.status === 'completed' ? 'followup_completed' : 'followup_pending',
        title: `Follow-up: ${f.title}`,
        description: `Due: ${f.due_date} | Priority: ${f.priority}`,
        timestamp: f.updated_at || f.created_at,
        statusBadge: f.status,
      });
    });

  // Sort newest first
  return items.sort((a, b) => {
    try {
      const timeA = parseISO(a.timestamp).getTime();
      const timeB = parseISO(b.timestamp).getTime();
      return timeB - timeA;
    } catch {
      return 0;
    }
  });
}
