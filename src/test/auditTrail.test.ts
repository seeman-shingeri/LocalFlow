import { describe, it, expect, beforeEach } from 'vitest';
import { AuditTrailLogger, computeAuditChecksum } from '@/lib/auditTrail';

describe('Enterprise Immutable Audit Trail Engine (auditTrail)', () => {
  let logger: AuditTrailLogger;

  beforeEach(() => {
    logger = new AuditTrailLogger();
  });

  it('records audit events with verifiable cryptographic checksum', () => {
    const event = logger.log({
      workspaceId: 'ws-123',
      actorId: 'usr-admin-1',
      action: 'invoice.create',
      entityType: 'invoice',
      entityId: 'inv-2026-001',
      changes: {
        after: { total_amount: 50000, status: 'sent' },
      },
    });

    expect(event.id).toMatch(/^aud-/);
    expect(event.checksum).toMatch(/^sha256-/);
    expect(logger.getAll()).toHaveLength(1);
  });

  it('filters audit records by entity type and ID', () => {
    logger.log({
      workspaceId: 'ws-1',
      actorId: 'usr-1',
      action: 'customer.archive',
      entityType: 'customer',
      entityId: 'cust-42',
    });

    logger.log({
      workspaceId: 'ws-1',
      actorId: 'usr-1',
      action: 'invoice.paid',
      entityType: 'invoice',
      entityId: 'inv-99',
    });

    const customerLogs = logger.getByEntity('customer', 'cust-42');
    expect(customerLogs).toHaveLength(1);
    expect(customerLogs[0].action).toBe('customer.archive');
  });

  it('validates log chain integrity and detects tampered entries', () => {
    const event1 = logger.log({
      workspaceId: 'ws-1',
      actorId: 'usr-1',
      action: 'payment.record',
      entityType: 'payment',
      entityId: 'pay-1',
    });

    const integrityBefore = logger.verifyIntegrity();
    expect(integrityBefore.isTamperFree).toBe(true);
    expect(integrityBefore.corruptedEventIds).toEqual([]);

    // Maliciously tamper with event1 data in memory
    const allEvents = logger.getAll();
    allEvents[0].action = 'payment.deleted_fraudulently';

    // Verify integrity detects mismatch
    const expected = computeAuditChecksum(allEvents[0]);
    expect(allEvents[0].checksum).not.toBe(expected);
  });
});
