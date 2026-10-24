import { describe, it, expect } from 'vitest';
import { createFinancialAuditEntry } from '@/lib/auditLogger';

describe('Financial Audit Log Event Formatter (auditLogger)', () => {
  const actor = { id: 'usr-1', name: 'Ramesh Manager', role: 'admin' };

  it('formats an invoice creation audit entry with amount', () => {
    const entry = createFinancialAuditEntry('invoice_created', 'invoice', 'INV-2026-008', actor, {
      amount: 45000,
    });

    expect(entry.eventType).toBe('invoice_created');
    expect(entry.entityId).toBe('INV-2026-008');
    expect(entry.actor.name).toBe('Ramesh Manager');
    expect(entry.summary).toBe('Ramesh Manager created invoice #INV-2026-008 for ₹45,000');
    expect(entry.id).toContain('audit_');
  });

  it('formats an invoice cancellation with reason', () => {
    const entry = createFinancialAuditEntry('invoice_cancelled', 'invoice', 'INV-2026-009', actor, {
      reason: 'Event rescheduled by client',
    });

    expect(entry.summary).toBe(
      'Ramesh Manager cancelled invoice #INV-2026-009 (Event rescheduled by client)'
    );
  });

  it('tracks field deltas when modifying items', () => {
    const deltas = [{ field: 'unit_price', before: 500, after: 450 }];
    const entry = createFinancialAuditEntry('item_price_modified', 'inventory', 'ITEM-CHAIR', actor, {
      deltas,
    });

    expect(entry.deltas).toEqual(deltas);
  });
});
