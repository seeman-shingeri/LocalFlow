import { Customer, Invoice, Appointment } from '@/types/database';

export type LoyaltyTier = 'vip' | 'repeat' | 'active' | 'prospect';

export interface CustomerLoyaltyMetrics {
  tier: LoyaltyTier;
  tierLabel: string;
  totalSpent: number;
  invoiceCount: number;
  completedBookingsCount: number;
  activeBookingsCount: number;
  discountEligibilityPercent: number;
}

/**
 * Computes customer loyalty metrics, lifetime spend, booking history, and discount eligibility.
 */
export function calculateCustomerLoyalty(
  customer: Customer,
  invoices: Invoice[] = [],
  appointments: Appointment[] = []
): CustomerLoyaltyMetrics {
  // Filter records belonging to this customer
  const customerInvoices = invoices.filter((inv) => inv.customer_id === customer.id);
  const customerAppointments = appointments.filter((apt) => apt.customer_id === customer.id);

  const totalSpent = customerInvoices.reduce(
    (sum, inv) => sum + (Number(inv.paid_amount) || 0),
    0
  );

  const completedBookingsCount = customerAppointments.filter(
    (apt) => apt.status === 'completed'
  ).length;

  const activeBookingsCount = customerAppointments.filter(
    (apt) => apt.status === 'scheduled'
  ).length;

  const paidInvoiceCount = customerInvoices.filter(
    (inv) => inv.status === 'paid' || (Number(inv.paid_amount) || 0) > 0
  ).length;

  let tier: LoyaltyTier = 'prospect';
  let tierLabel = 'Prospect';
  let discountEligibilityPercent = 0;

  if (totalSpent >= 5000 || completedBookingsCount >= 5 || paidInvoiceCount >= 5) {
    tier = 'vip';
    tierLabel = 'VIP Partner';
    discountEligibilityPercent = 15;
  } else if (totalSpent >= 1500 || completedBookingsCount >= 2 || paidInvoiceCount >= 2) {
    tier = 'repeat';
    tierLabel = 'Repeat Client';
    discountEligibilityPercent = 10;
  } else if (totalSpent > 0 || activeBookingsCount > 0 || completedBookingsCount > 0) {
    tier = 'active';
    tierLabel = 'Active Client';
    discountEligibilityPercent = 5;
  }

  return {
    tier,
    tierLabel,
    totalSpent: Math.round(totalSpent * 100) / 100,
    invoiceCount: customerInvoices.length,
    completedBookingsCount,
    activeBookingsCount,
    discountEligibilityPercent,
  };
}
