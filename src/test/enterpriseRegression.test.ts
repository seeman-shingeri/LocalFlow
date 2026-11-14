import { describe, it, expect, beforeEach } from 'vitest';
import { customerService } from '@/services/customerService';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import { analyticsService } from '@/services/analyticsService';
import { localDb } from '@/lib/localStorageDb';
import { idempotency } from '@/lib/idempotencyGuard';
import { dashboardCache } from '@/lib/dashboardCache';
import { auditWorkspaceBoundary } from '@/lib/rlsAudit';
import { recalculateInvoice } from '@/lib/invoiceRecalculator';

describe('Enterprise Automated Regression Test Suite (enterpriseRegression)', () => {
  const WORKSPACE_A = 'ws-regression-alpha';
  const WORKSPACE_B = 'ws-regression-beta';

  beforeEach(() => {
    localDb.resetAll();
    idempotency.clear();
    dashboardCache.clear();
  });

  it('Regression Flow 1: Lead-to-Cash Lifecycle with Ledger Consistency and Cache Reconciliation', async () => {
    // 1. Create Customer in Workspace A
    const customer = await customerService.create({
      workspace_id: WORKSPACE_A,
      name: 'Priya Sharma Events',
      email: 'priya@sharmaevents.in',
      phone: '+919876543210',
      status: 'active',
      source: 'referral',
      tags: ['vip', 'wedding'],
    });

    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Priya Sharma Events');

    // 2. Generate Invoice with line item recalculation
    const lineItems = [
      { description: 'Royal German Hangar Tent 50x100', quantity: 1, unitPrice: 60000, taxRate: 18 },
      { description: 'VIP Banquet Seating Set', quantity: 20, unitPrice: 1000, taxRate: 18 },
    ];

    const calculation = recalculateInvoice(lineItems);
    expect(calculation.itemsGrossSubtotal).toBe(80000);
    expect(calculation.itemsTaxTotal).toBe(14400);
    expect(calculation.grandTotal).toBe(94400);

    const invoice = await invoiceService.create({
      workspace_id: WORKSPACE_A,
      customer_id: customer.id,
      customer_name: customer.name,
      issue_date: '2026-11-01',
      due_date: '2026-11-15',
      subtotal: calculation.itemsGrossSubtotal,
      tax_rate: 18,
      tax_amount: calculation.itemsTaxTotal,
      total_amount: calculation.grandTotal,
      items: [
        {
          id: 'item-1',
          description: lineItems[0].description,
          quantity: lineItems[0].quantity,
          unit_price: lineItems[0].unitPrice,
          total_price: 60000,
        },
        {
          id: 'item-2',
          description: lineItems[1].description,
          quantity: lineItems[1].quantity,
          unit_price: lineItems[1].unitPrice,
          total_price: 20000,
        },
      ],
      notes: 'Initial wedding booking contract',
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe('sent');
    expect(invoice.paid_amount).toBe(0);
    expect(invoice.balance_due).toBe(94400);

    // Initial Dashboard Check (Warm cache)
    const initialMetrics = await analyticsService.getDashboardMetrics(WORKSPACE_A, 30);
    expect(initialMetrics.totalCustomers).toBe(1);
    expect(initialMetrics.totalOutstandingInvoices).toBe(94400);
    expect(initialMetrics.totalRevenueAllTime).toBe(0);

    // 3. Record Partial Advance Payment
    const partialPay = await paymentService.recordPayment({
      workspace_id: WORKSPACE_A,
      invoice_id: invoice.id,
      customer_id: customer.id,
      amount: 40000,
      payment_method: 'bank_transfer',
      transaction_reference: 'UTR-REG-9871',
    });

    expect(partialPay.id).toBeDefined();

    // Verify invoice balance was updated automatically
    const updatedInvoice1 = (await invoiceService.getAll(WORKSPACE_A)).find((i) => i.id === invoice.id);
    expect(updatedInvoice1?.status).toBe('partial');
    expect(updatedInvoice1?.paid_amount).toBe(40000);
    expect(updatedInvoice1?.balance_due).toBe(54400);

    // Invalidate and verify dashboard metrics reflect advance
    analyticsService.invalidateCache(WORKSPACE_A);
    const midMetrics = await analyticsService.getDashboardMetrics(WORKSPACE_A, 30);
    expect(midMetrics.totalOutstandingInvoices).toBe(54400);
    expect(midMetrics.totalRevenueAllTime).toBe(40000);

    // 4. Record Final Settle Payment
    const finalPay = await paymentService.recordPayment({
      workspace_id: WORKSPACE_A,
      invoice_id: invoice.id,
      customer_id: customer.id,
      amount: 54400,
      payment_method: 'upi',
      transaction_reference: 'UPI-REG-1122',
    });

    expect(finalPay.id).toBeDefined();

    const finalizedInvoice = (await invoiceService.getAll(WORKSPACE_A)).find((i) => i.id === invoice.id);
    expect(finalizedInvoice?.status).toBe('paid');
    expect(finalizedInvoice?.paid_amount).toBe(94400);
    expect(finalizedInvoice?.balance_due).toBe(0);

    analyticsService.invalidateCache(WORKSPACE_A);
    const finalMetrics = await analyticsService.getDashboardMetrics(WORKSPACE_A, 30);
    expect(finalMetrics.totalOutstandingInvoices).toBe(0);
    expect(finalMetrics.totalRevenueAllTime).toBe(94400);
  });

  it('Regression Flow 2: Multi-Tenant Workspace Boundary Isolation', async () => {
    // Add customer to Workspace A
    const custA = await customerService.create({
      workspace_id: WORKSPACE_A,
      name: 'Workspace A Client',
      phone: '+919999900001',
      status: 'active',
      source: 'direct',
    });

    // Add customer to Workspace B
    const custB = await customerService.create({
      workspace_id: WORKSPACE_B,
      name: 'Workspace B Client',
      phone: '+919999900002',
      status: 'active',
      source: 'direct',
    });

    const listA = await customerService.getAll(WORKSPACE_A);
    const listB = await customerService.getAll(WORKSPACE_B);

    // Complete data isolation verification
    expect(listA.some((c) => c.id === custA.id)).toBe(true);
    expect(listA.some((c) => c.id === custB.id)).toBe(false);

    expect(listB.some((c) => c.id === custB.id)).toBe(true);
    expect(listB.some((c) => c.id === custA.id)).toBe(false);

    // Verify security boundary audit
    const crossCheck = auditWorkspaceBoundary(WORKSPACE_A, custB.workspace_id, 'customer');
    expect(crossCheck.authorized).toBe(false);
  });

  it('Regression Flow 3: Concurrency & Duplicate Payment Protection', async () => {
    const cust = await customerService.create({
      workspace_id: WORKSPACE_A,
      name: 'Rapid Clicker Client',
      phone: '+919888877777',
      status: 'active',
      source: 'web',
    });

    const inv = await invoiceService.create({
      workspace_id: WORKSPACE_A,
      customer_id: cust.id,
      customer_name: cust.name,
      issue_date: '2026-11-01',
      due_date: '2026-11-10',
      subtotal: 10000,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: 10000,
      items: [{ id: '1', description: 'Sound System', quantity: 1, unit_price: 10000, total_price: 10000 }],
    });

    // Simulate 3 concurrent clicks on payment submission
    const paymentInput = {
      workspace_id: WORKSPACE_A,
      invoice_id: inv.id,
      customer_id: cust.id,
      amount: 5000,
      payment_method: 'cash' as const,
      transaction_reference: 'CASH-REC-1',
    };

    const results = await Promise.all([
      paymentService.recordPayment(paymentInput),
      paymentService.recordPayment(paymentInput),
      paymentService.recordPayment(paymentInput),
    ]);

    // All return identical payment token
    expect(results[0].id).toBe(results[1].id);
    expect(results[1].id).toBe(results[2].id);

    // Invoice was only debited once
    const invCheck = (await invoiceService.getAll(WORKSPACE_A)).find((i) => i.id === inv.id);
    expect(invCheck?.paid_amount).toBe(5000);
    expect(invCheck?.balance_due).toBe(5000);
  });
});
