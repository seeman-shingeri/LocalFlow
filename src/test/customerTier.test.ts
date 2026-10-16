import { describe, it, expect } from 'vitest';
import { calculateCustomerLoyalty } from '@/lib/customerTierService';
import { Customer, Invoice, Appointment } from '@/types/database';

describe('Customer Loyalty Tier Service', () => {
  const baseCustomer: Customer = {
    id: 'cust-10',
    workspace_id: 'ws-1',
    name: 'Austin Grand Events',
    email: 'info@austingrand.com',
    phone: '+1 512 555 7777',
    address: 'Austin, TX',
    notes: null,
    source: 'Website',
    status: 'active',
    last_contact_date: null,
    next_follow_up_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  it('classifies customer with >= $5,000 paid spend as VIP Partner', () => {
    const invoices: Invoice[] = [
      {
        id: 'inv-1',
        workspace_id: 'ws-1',
        customer_id: 'cust-10',
        invoice_number: 'INV-001',
        issue_date: '2026-02-01',
        due_date: '2026-02-15',
        subtotal: 5500,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: 5500,
        paid_amount: 5500,
        balance_due: 0,
        status: 'paid',
        notes: null,
        terms: null,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      },
    ];

    const loyalty = calculateCustomerLoyalty(baseCustomer, invoices, []);
    expect(loyalty.tier).toBe('vip');
    expect(loyalty.tierLabel).toBe('VIP Partner');
    expect(loyalty.totalSpent).toBe(5500);
    expect(loyalty.discountEligibilityPercent).toBe(15);
  });

  it('classifies customer with >= $1,500 spend as Repeat Client', () => {
    const invoices: Invoice[] = [
      {
        id: 'inv-1',
        workspace_id: 'ws-1',
        customer_id: 'cust-10',
        invoice_number: 'INV-001',
        issue_date: '2026-03-01',
        due_date: '2026-03-15',
        subtotal: 1800,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: 1800,
        paid_amount: 1800,
        balance_due: 0,
        status: 'paid',
        notes: null,
        terms: null,
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
      },
    ];

    const loyalty = calculateCustomerLoyalty(baseCustomer, invoices, []);
    expect(loyalty.tier).toBe('repeat');
    expect(loyalty.tierLabel).toBe('Repeat Client');
    expect(loyalty.discountEligibilityPercent).toBe(10);
  });

  it('classifies customer with active bookings as Active Client', () => {
    const appointments: Appointment[] = [
      {
        id: 'apt-1',
        workspace_id: 'ws-1',
        customer_id: 'cust-10',
        title: 'Shamiyana Setup',
        start_time: '2026-11-01T10:00:00Z',
        end_time: '2026-11-01T12:00:00Z',
        duration_minutes: 120,
        status: 'scheduled',
        location: 'Austin',
        notes: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];

    const loyalty = calculateCustomerLoyalty(baseCustomer, [], appointments);
    expect(loyalty.tier).toBe('active');
    expect(loyalty.tierLabel).toBe('Active Client');
    expect(loyalty.activeBookingsCount).toBe(1);
    expect(loyalty.discountEligibilityPercent).toBe(5);
  });

  it('classifies new lead without transactions as Prospect', () => {
    const loyalty = calculateCustomerLoyalty(baseCustomer, [], []);
    expect(loyalty.tier).toBe('prospect');
    expect(loyalty.tierLabel).toBe('Prospect');
    expect(loyalty.totalSpent).toBe(0);
    expect(loyalty.discountEligibilityPercent).toBe(0);
  });
});
