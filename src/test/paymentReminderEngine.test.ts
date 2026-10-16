import { describe, it, expect } from 'vitest';
import {
  getOverdueAgingTier,
  generateInvoiceReminderMessage,
} from '@/lib/paymentReminderEngine';
import { Invoice, Customer } from '@/types/database';

describe('Payment Reminder Escalation Engine', () => {
  const mockCustomer: Customer = {
    id: 'cust-1',
    workspace_id: 'ws-1',
    name: 'Rajesh Patel',
    email: 'rajesh@example.com',
    phone: '+1 512 555 1234',
    address: 'Austin, TX',
    notes: null,
    source: 'Direct',
    status: 'active',
    last_contact_date: null,
    next_follow_up_date: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };

  const mockInvoice: Invoice = {
    id: 'inv-101',
    workspace_id: 'ws-1',
    customer_id: 'cust-1',
    invoice_number: 'INV-2026-042',
    issue_date: '2026-09-01',
    due_date: '2026-09-15',
    subtotal: 1500,
    tax_rate: 10,
    tax_amount: 150,
    total_amount: 1650,
    paid_amount: 500,
    balance_due: 1150,
    status: 'partial',
    notes: null,
    terms: null,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-16T00:00:00Z',
    customer: mockCustomer,
  };

  it('correctly maps overdue days to escalation aging tiers', () => {
    expect(getOverdueAgingTier(1)).toBe('courtesy');
    expect(getOverdueAgingTier(14)).toBe('courtesy');
    expect(getOverdueAgingTier(15)).toBe('firm');
    expect(getOverdueAgingTier(30)).toBe('firm');
    expect(getOverdueAgingTier(31)).toBe('urgent');
    expect(getOverdueAgingTier(60)).toBe('urgent');
  });

  it('generates polite courtesy notice for 1-14 days overdue', () => {
    const notice = generateInvoiceReminderMessage({
      invoice: mockInvoice,
      customer: mockCustomer,
      daysOverdue: 7,
      businessName: 'Apex Shamiyana & Rentals',
      currency: 'USD',
    });

    expect(notice.tier).toBe('courtesy');
    expect(notice.subject).toContain('Courtesy Reminder: Invoice INV-2026-042');
    expect(notice.body).toContain('Dear Rajesh Patel,');
    expect(notice.body).toContain('$1,150.00');
    expect(notice.body).toContain('7 days ago');
    expect(notice.body).toContain('Apex Shamiyana & Rentals');
  });

  it('generates firm follow-up notice for 15-30 days overdue', () => {
    const notice = generateInvoiceReminderMessage({
      invoice: mockInvoice,
      customer: mockCustomer,
      daysOverdue: 22,
      businessName: 'Apex Shamiyana & Rentals',
      currency: 'USD',
    });

    expect(notice.tier).toBe('firm');
    expect(notice.subject).toContain('Second Notice: Invoice INV-2026-042 is 22 Days Past Due');
    expect(notice.body).toContain('22 days overdue');
    expect(notice.body).toContain('prevent holds on upcoming equipment rentals');
    expect(notice.body).toContain('within 3 business days');
  });

  it('generates urgent final notice for 31+ days overdue', () => {
    const notice = generateInvoiceReminderMessage({
      invoice: mockInvoice,
      customer: mockCustomer,
      daysOverdue: 45,
      businessName: 'Apex Shamiyana & Rentals',
      currency: 'USD',
    });

    expect(notice.tier).toBe('urgent');
    expect(notice.subject).toContain('URGENT NOTICE');
    expect(notice.body).toContain('ATTENTION: Rajesh Patel');
    expect(notice.body).toContain('45 days past due');
    expect(notice.body).toContain('suspension of rental privileges');
  });
});
