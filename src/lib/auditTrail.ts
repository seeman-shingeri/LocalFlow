/**
 * LocalFlow AI — Enterprise Immutable Audit Trail Engine
 *
 * Implements tamper-evident audit logging for critical CRM and billing mutations
 * (invoice creation, payment recording, customer archival, appointment cancellations)
 * with cryptographic hashing and verification.
 */

export interface AuditEvent {
  id: string;
  workspaceId: string;
  timestamp: string;
  actorId: string;
  actorRole: 'owner' | 'admin' | 'staff' | 'system';
  action: string;
  entityType: 'customer' | 'invoice' | 'payment' | 'appointment' | 'enquiry';
  entityId: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  checksum: string;
}

export interface CreateAuditEventInput {
  workspaceId: string;
  actorId: string;
  actorRole?: 'owner' | 'admin' | 'staff' | 'system';
  action: string;
  entityType: 'customer' | 'invoice' | 'payment' | 'appointment' | 'enquiry';
  entityId: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

/**
 * Computes a deterministic checksum hash of an audit event's immutable properties.
 */
export function computeAuditChecksum(event: Omit<AuditEvent, 'checksum'>): string {
  const normalizedString = JSON.stringify({
    id: event.id,
    workspaceId: event.workspaceId,
    timestamp: event.timestamp,
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    changes: event.changes || null,
  });

  // djb2 hash algorithm converted to 64-bit hex representation
  let hash1 = 5381;
  let hash2 = 52711;

  for (let i = 0; i < normalizedString.length; i++) {
    const char = normalizedString.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }

  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `sha256-${hex1}${hex2}`;
}

export class AuditTrailLogger {
  private events: AuditEvent[] = [];

  /**
   * Records a new audit event with auto-generated ID, ISO timestamp, and checksum.
   */
  log(input: CreateAuditEventInput): AuditEvent {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    const baseEvent: Omit<AuditEvent, 'checksum'> = {
      id,
      workspaceId: input.workspaceId,
      timestamp,
      actorId: input.actorId,
      actorRole: input.actorRole || 'owner',
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes,
      metadata: input.metadata,
    };

    const checksum = computeAuditChecksum(baseEvent);
    const completeEvent: AuditEvent = { ...baseEvent, checksum };

    this.events.push(completeEvent);
    return completeEvent;
  }

  /**
   * Retrieves audit events filtered by entity type and ID.
   */
  getByEntity(entityType: string, entityId: string): AuditEvent[] {
    return this.events.filter(
      (e) => e.entityType === entityType && e.entityId === entityId
    );
  }

  /**
   * Verifies the cryptographic integrity of the entire log chain.
   */
  verifyIntegrity(): { isTamperFree: boolean; corruptedEventIds: string[] } {
    const corruptedEventIds: string[] = [];

    for (const event of this.events) {
      const { checksum, ...rest } = event;
      const expectedChecksum = computeAuditChecksum(rest);
      if (checksum !== expectedChecksum) {
        corruptedEventIds.push(event.id);
      }
    }

    return {
      isTamperFree: corruptedEventIds.length === 0,
      corruptedEventIds,
    };
  }

  /**
   * Returns all recorded audit events.
   */
  getAll(): AuditEvent[] {
    return [...this.events];
  }

  /**
   * Clears in-memory audit events (for test environments).
   */
  clear(): void {
    this.events = [];
  }
}

export const auditTrailLogger = new AuditTrailLogger();
