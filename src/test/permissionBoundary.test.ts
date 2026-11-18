import { describe, it, expect, beforeEach } from 'vitest';
import { localDb } from '@/lib/localStorageDb';
import { customerService } from '@/services/customerService';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import { appointmentService } from '@/services/appointmentService';
import { validatePayloadWorkspace, verifyTenantMembership } from '@/lib/rlsAudit';

describe('Enterprise Multi-Tenant Permission Boundary Security Suite (permissionBoundary)', () => {
  const TENANT_ALPHA = 'ws-tenant-alpha-001';
  const TENANT_BETA = 'ws-tenant-beta-002';

  beforeEach(() => {
    localDb.resetAll();
  });

  it('prevents Tenant Beta from reading Tenant Alpha customer records', async () => {
    const alphaCust = await customerService.create({
      workspace_id: TENANT_ALPHA,
      name: 'Alpha Confidential Client',
      email: 'alpha@secret.com',
      phone: '+919999900001',
      address: null,
      notes: 'Proprietary enterprise client',
      status: 'active',
      source: 'referral',
      last_contact_date: null,
      next_follow_up_date: null,
    });

    // Tenant Alpha can query their client
    const alphaList = await customerService.getAll(TENANT_ALPHA);
    expect(alphaList.some((c) => c.id === alphaCust.id)).toBe(true);

    // Tenant Beta querying their customers must not see Tenant Alpha client
    const betaList = await customerService.getAll(TENANT_BETA);
    expect(betaList.some((c) => c.id === alphaCust.id)).toBe(false);
  });

  it('prevents Tenant Beta from retrieving Tenant Alpha invoices by ID', async () => {
    const alphaCust = await customerService.create({
      workspace_id: TENANT_ALPHA,
      name: 'Alpha VIP',
      email: null,
      phone: '+919999900002',
      address: null,
      notes: null,
      status: 'active',
      source: 'web',
      last_contact_date: null,
      next_follow_up_date: null,
    });

    const invNum = await invoiceService.getNextInvoiceNumber(TENANT_ALPHA);
    const alphaInv = await invoiceService.create({
      workspace_id: TENANT_ALPHA,
      customer_id: alphaCust.id,
      invoice_number: invNum,
      issue_date: '2026-11-01',
      due_date: '2026-11-15',
      tax_rate: 18,
      items: [{ description: 'Secret Event Rigging', quantity: 1, unit_price: 100000 }],
    });

    // Tenant Alpha retrieves successfully
    const alphaAccess = await invoiceService.getById(alphaInv.id, TENANT_ALPHA);
    expect(alphaAccess).not.toBeNull();
    expect(alphaAccess?.id).toBe(alphaInv.id);

    // Tenant Beta attempting to access Tenant Alpha's invoice by ID gets null
    const betaAccess = await invoiceService.getById(alphaInv.id, TENANT_BETA);
    expect(betaAccess).toBeNull();
  });

  it('blocks cross-tenant payment recording against foreign invoices', async () => {
    const alphaCust = await customerService.create({
      workspace_id: TENANT_ALPHA,
      name: 'Alpha Client',
      email: null,
      phone: '+919999900003',
      address: null,
      notes: null,
      status: 'active',
      source: 'web',
      last_contact_date: null,
      next_follow_up_date: null,
    });

    const invNum = await invoiceService.getNextInvoiceNumber(TENANT_ALPHA);
    const alphaInv = await invoiceService.create({
      workspace_id: TENANT_ALPHA,
      customer_id: alphaCust.id,
      invoice_number: invNum,
      issue_date: '2026-11-01',
      due_date: '2026-11-15',
      tax_rate: 0,
      items: [{ description: 'Shamiyana Setup', quantity: 1, unit_price: 25000 }],
    });

    // Malicious attempt by Tenant Beta to apply a payment using Tenant Beta workspace ID
    // but referencing Tenant Alpha's invoice
    await expect(
      paymentService.recordPayment({
        workspace_id: TENANT_BETA,
        invoice_id: alphaInv.id,
        customer_id: alphaCust.id,
        amount: 25000,
        payment_method: 'card',
        transaction_reference: 'MALICIOUS-TXN-1',
      })
    ).rejects.toThrow();
  });

  it('strictly validates payload workspace IDs against the active tenant session', () => {
    // Valid payload matching active session
    const validResult = validatePayloadWorkspace(
      { workspace_id: TENANT_ALPHA, name: 'Legit Resource' },
      TENANT_ALPHA
    );
    expect(validResult.isValid).toBe(true);

    // Injected foreign workspace_id in payload
    const spoofedResult = validatePayloadWorkspace(
      { workspace_id: TENANT_BETA, name: 'Spoofed Resource' },
      TENANT_ALPHA
    );
    expect(spoofedResult.isValid).toBe(false);
    expect(spoofedResult.error).toContain('mismatch');
  });

  it('verifies tenant membership security guard rejects unauthorized users', () => {
    const context = {
      userId: 'user-alpha',
      memberWorkspaceIds: [TENANT_ALPHA],
    };

    expect(verifyTenantMembership(context, TENANT_ALPHA)).toBe(true);
    expect(verifyTenantMembership(context, TENANT_BETA)).toBe(false);
  });
});
