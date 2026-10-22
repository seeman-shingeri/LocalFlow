import { describe, it, expect } from 'vitest';
import { buildCustomerActivityTimeline } from '@/lib/customerTimeline';
import { Enquiry, Appointment, Invoice, FollowUp, Payment } from '@/types/database';

describe('Customer Activity Timeline Aggregator (customerTimeline)', () => {
  const customerId = 'cust-101';

  const mockEnquiry: Enquiry = {
    id: 'enq-1',
    workspace_id: 'ws-1',
    customer_id: customerId,
    title: 'Outdoor Wedding Tent',
    service_type: 'Rental',
    estimated_value: 2500,
    status: 'interested',
    priority: 'high',
    notes: null,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
  };

  const mockAppointment: Appointment = {
    id: 'apt-1',
    workspace_id: 'ws-1',
    customer_id: customerId,
    title: 'Site Visit & Measurement',
    start_time: '2026-10-05T14:00:00Z',
    end_time: '2026-10-05T15:00:00Z',
    duration_minutes: 60,
    status: 'completed',
    location: '100 Sunset Blvd',
    notes: null,
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-10-05T16:00:00Z',
  };

  const mockInvoice: Invoice = {
    id: 'inv-1',
    workspace_id: 'ws-1',
    customer_id: customerId,
    invoice_number: 'INV-2026-001',
    issue_date: '2026-10-06',
    due_date: '2026-10-20',
    subtotal: 2500,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 2500,
    paid_amount: 1000,
    balance_due: 1500,
    status: 'partial',
    notes: null,
    terms: null,
    created_at: '2026-10-06T11:00:00Z',
    updated_at: '2026-10-06T11:00:00Z',
  };

  const mockPayment: Payment = {
    id: 'pmt-1',
    workspace_id: 'ws-1',
    invoice_id: 'inv-1',
    customer_id: customerId,
    amount: 1000,
    payment_date: '2026-10-07T12:00:00Z',
    payment_method: 'card',
    transaction_reference: 'TX-9988',
    notes: null,
    created_at: '2026-10-07T12:00:00Z',
  };

  it('aggregates events across multiple collections and sorts newest first', () => {
    const timeline = buildCustomerActivityTimeline({
      customerId,
      enquiries: [mockEnquiry],
      appointments: [mockAppointment],
      invoices: [mockInvoice],
      payments: [mockPayment],
    });

    expect(timeline).toHaveLength(4);

    // Newest is Oct 7 payment
    expect(timeline[0].type).toBe('payment_received');
    expect(timeline[0].title).toContain('$1000.00');

    // Next is Oct 6 invoice
    expect(timeline[1].type).toBe('invoice_issued');
    expect(timeline[1].title).toContain('INV-2026-001');

    // Next is Oct 5 appointment
    expect(timeline[2].type).toBe('appointment_completed');
    expect(timeline[2].title).toContain('Site Visit');

    // Oldest is Oct 1 enquiry
    expect(timeline[3].type).toBe('enquiry_created');
    expect(timeline[3].title).toContain('Outdoor Wedding Tent');
  });

  it('filters out records belonging to other customers', () => {
    const otherEnquiry: Enquiry = {
      ...mockEnquiry,
      id: 'enq-other',
      customer_id: 'cust-999',
    };

    const timeline = buildCustomerActivityTimeline({
      customerId,
      enquiries: [mockEnquiry, otherEnquiry],
    });

    expect(timeline).toHaveLength(1);
    expect(timeline[0].id).toBe('enq-enq-1');
  });

  it('handles empty options without error', () => {
    const timeline = buildCustomerActivityTimeline({ customerId });
    expect(timeline).toEqual([]);
  });
});
