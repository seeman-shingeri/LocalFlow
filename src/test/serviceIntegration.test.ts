import { describe, it, expect, beforeEach } from 'vitest';
import { localDb, INITIAL_WORKSPACE } from '../lib/localStorageDb';
import { customerService } from '../services/customerService';
import { invoiceService } from '../services/invoiceService';
import { paymentService } from '../services/paymentService';
import { followUpService } from '../services/followUpService';
import { appointmentService } from '../services/appointmentService';
import { analyticsService } from '../services/analyticsService';
import { aiService } from '../services/aiService';
import { addDays, subDays, format } from 'date-fns';

const WORKSPACE_ID = INITIAL_WORKSPACE.id;

describe('LocalFlow AI Service Layer & Business Workflows Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    localDb.resetAll();
  });

  describe('Customer Management & Duplicate Prevention', () => {
    it('fetches seeded customers and filters by status and search query', async () => {
      const all = await customerService.getAll(WORKSPACE_ID);
      expect(all.length).toBeGreaterThanOrEqual(5);

      const leads = await customerService.getAll(WORKSPACE_ID, { status: 'lead' });
      expect(leads.every((c) => c.status === 'lead')).toBe(true);

      const searchResult = await customerService.getAll(WORKSPACE_ID, { search: 'Sarah Jenkins' });
      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].email).toBe('sarah.jenkins@gmail.com');
    });

    it('detects duplicate customers by case-insensitive email or normalized phone number', async () => {
      const dupByEmail = await customerService.checkDuplicate(
        WORKSPACE_ID,
        'SARAH.JENKINS@GMAIL.COM',
        undefined
      );
      expect(dupByEmail).not.toBeNull();
      expect(dupByEmail?.id).toBe('cust-001');

      const dupByPhone = await customerService.checkDuplicate(
        WORKSPACE_ID,
        undefined,
        '15125550192'
      );
      expect(dupByPhone).not.toBeNull();
      expect(dupByPhone?.id).toBe('cust-001');

      // Excludes self when editing existing customer
      const selfExcluded = await customerService.checkDuplicate(
        WORKSPACE_ID,
        'sarah.jenkins@gmail.com',
        '+1 (512) 555-0192',
        'cust-001'
      );
      expect(selfExcluded).toBeNull();
    });

    it('creates, updates, archives, and loads 360 customer relations', async () => {
      const created = await customerService.create({
        workspace_id: WORKSPACE_ID,
        name: 'Liam OConnor',
        email: 'liam@oconnorplumbing.com',
        phone: '+1 (512) 555-0999',
        address: '900 Congress Ave, Austin, TX',
        notes: 'New commercial account',
        source: 'Referral',
        status: 'lead',
        last_contact_date: null,
        next_follow_up_date: null,
      });

      expect(created.id).toBeTruthy();
      expect(created.status).toBe('lead');

      const archived = await customerService.archive(created.id);
      expect(archived.status).toBe('archived');

      const profile360 = await customerService.getById('cust-001', WORKSPACE_ID);
      expect(profile360).not.toBeNull();
      expect(Array.isArray(profile360?.enquiries)).toBe(true);
      expect(Array.isArray(profile360?.invoices)).toBe(true);
      expect(Array.isArray(profile360?.payments)).toBe(true);
    });
  });

  describe('Invoice Lifecycle, Collision-Safe Numbering & Payment Ledger', () => {
    it('generates collision-safe invoice numbers even after deleting earlier invoices', async () => {
      const firstNum = await invoiceService.getNextInvoiceNumber(WORKSPACE_ID);
      // Seed has INV-2025-001..004; deleting one should still increment past the max numeric suffix
      const allBefore = await invoiceService.getAll(WORKSPACE_ID);
      await invoiceService.delete(allBefore[allBefore.length - 1].id, WORKSPACE_ID);

      const nextAfterDelete = await invoiceService.getNextInvoiceNumber(WORKSPACE_ID);
      expect(nextAfterDelete).toBe(firstNum);
    });

    it('supports draft invoices without marking them overdue or inflating outstanding receivables', async () => {
      const metricsBefore = await analyticsService.getDashboardMetrics(WORKSPACE_ID);

      const pastDue = format(subDays(new Date(), 5), 'yyyy-MM-dd');
      const issueDate = format(subDays(new Date(), 15), 'yyyy-MM-dd');

      const draftInv = await invoiceService.create({
        workspace_id: WORKSPACE_ID,
        customer_id: 'cust-001',
        invoice_number: 'INV-2026-900',
        issue_date: issueDate,
        due_date: pastDue,
        tax_rate: 8.25,
        status: 'draft',
        notes: 'Draft quote pending approval',
        items: [{ description: 'System Retrofit', quantity: 1, unit_price: 2000 }],
      });

      expect(draftInv.status).toBe('draft');

      const allInvoices = await invoiceService.getAll(WORKSPACE_ID);
      const reloadedDraft = allInvoices.find((i) => i.id === draftInv.id);
      expect(reloadedDraft?.status).toBe('draft');

      const metricsAfter = await analyticsService.getDashboardMetrics(WORKSPACE_ID);
      expect(metricsAfter.outstandingInvoiceAmount).toBe(metricsBefore.outstandingInvoiceAmount);
    });

    it('preserves partial payment status and updates balances accurately through full payment', async () => {
      const partialInvoices = await invoiceService.getAll(WORKSPACE_ID, { status: 'partial' });
      expect(partialInvoices.length).toBeGreaterThanOrEqual(1);
      expect(partialInvoices[0].status).toBe('partial');

      const target = partialInvoices[0];
      const remaining = target.balance_due;

      // Reject invalid payment amount
      await expect(
        paymentService.recordPayment({
          workspace_id: WORKSPACE_ID,
          invoice_id: target.id,
          customer_id: target.customer_id,
          amount: 0,
          payment_method: 'card',
        })
      ).rejects.toThrow('Payment amount must be greater than zero.');

      // Pay off remaining balance
      await paymentService.recordPayment({
        workspace_id: WORKSPACE_ID,
        invoice_id: target.id,
        customer_id: target.customer_id,
        amount: remaining,
        payment_method: 'bank_transfer',
        transaction_reference: 'ACH-99102',
      });

      const updatedInvoices = await invoiceService.getAll(WORKSPACE_ID);
      const paidInvoice = updatedInvoices.find((i) => i.id === target.id);
      expect(paidInvoice?.status).toBe('paid');
      expect(paidInvoice?.balance_due).toBe(0);
      expect(paidInvoice?.paid_amount).toBe(target.total_amount);
    });
  });

  describe('Follow-up Editing & Categorization', () => {
    it('creates and updates all follow-up fields and syncs customer next_follow_up_date', async () => {
      const tomorrowIso = addDays(new Date(), 1).toISOString();
      const created = await followUpService.create({
        workspace_id: WORKSPACE_ID,
        customer_id: 'cust-001',
        enquiry_id: null,
        title: 'Initial maintenance call',
        due_date: tomorrowIso,
        status: 'pending',
        priority: 'medium',
        notes: 'Ask about filter size',
      });

      const nextWeekIso = addDays(new Date(), 7).toISOString();
      const updated = await followUpService.update(created.id, {
        title: 'Updated maintenance & warranty call',
        priority: 'high',
        due_date: nextWeekIso,
        notes: 'Confirmed 20x25x4 filter size',
      });

      expect(updated.title).toBe('Updated maintenance & warranty call');
      expect(updated.priority).toBe('high');
      expect(updated.due_date).toBe(nextWeekIso);
      expect(updated.notes).toBe('Confirmed 20x25x4 filter size');

      const customer = await customerService.getById('cust-001', WORKSPACE_ID);
      expect(customer?.next_follow_up_date).toBe(nextWeekIso);

      const completed = await followUpService.markComplete(created.id, 'Customer booked for Friday');
      expect(completed.status).toBe('completed');
      expect(completed.completed_at).toBeTruthy();
    });
  });

  describe('Appointment Scheduling & Conflict Detection', () => {
    it('detects overlapping scheduled appointments and ignores non-overlapping or self IDs', async () => {
      const baseStart = new Date(2026, 10, 15, 10, 0, 0);
      const baseEnd = new Date(2026, 10, 15, 11, 30, 0);

      const apt = await appointmentService.create({
        workspace_id: WORKSPACE_ID,
        customer_id: 'cust-001',
        title: 'HVAC Compressor Replacement',
        start_time: baseStart.toISOString(),
        end_time: baseEnd.toISOString(),
        duration_minutes: 90,
        location: '1420 Oak Ridge Trail',
        status: 'scheduled',
        notes: null,
      });

      // Overlapping window (10:30 - 11:30)
      const overlapStart = new Date(2026, 10, 15, 10, 30, 0).toISOString();
      const overlapEnd = new Date(2026, 10, 15, 11, 30, 0).toISOString();
      const conflicts = await appointmentService.checkConflict(WORKSPACE_ID, overlapStart, overlapEnd);
      expect(conflicts.some((c) => c.id === apt.id)).toBe(true);

      // Excluding self when editing the same appointment returns no conflict for itself
      const selfConflicts = await appointmentService.checkConflict(
        WORKSPACE_ID,
        overlapStart,
        overlapEnd,
        apt.id
      );
      expect(selfConflicts.some((c) => c.id === apt.id)).toBe(false);

      // Non-overlapping window (11:30 - 12:30)
      const afterStart = new Date(2026, 10, 15, 11, 30, 0).toISOString();
      const afterEnd = new Date(2026, 10, 15, 12, 30, 0).toISOString();
      const noConflicts = await appointmentService.checkConflict(WORKSPACE_ID, afterStart, afterEnd);
      expect(noConflicts.some((c) => c.id === apt.id)).toBe(false);
    });
  });

  describe('AI Follow-Up Assistant & Workspace Insights', () => {
    it('generates context-aware message drafts and actionable workspace insights', async () => {
      const customers = await customerService.getAll(WORKSPACE_ID);
      const draft = await aiService.draftMessage({
        customer: customers[0],
        contextType: 'follow_up',
        channel: 'email',
        businessName: INITIAL_WORKSPACE.name,
      });

      expect(draft.subject).toContain(INITIAL_WORKSPACE.name);
      expect(draft.message).toContain(customers[0].name.split(' ')[0]);

      const queryResponse = await aiService.processAssistantQuery(
        WORKSPACE_ID,
        INITIAL_WORKSPACE.name,
        'Which invoices are overdue?'
      );
      expect(queryResponse.answer).toBeTruthy();
      expect(queryResponse.verifiedFacts.length).toBeGreaterThan(0);
    });
  });
});
