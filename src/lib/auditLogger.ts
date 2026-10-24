export type FinancialAuditEventType =
  | 'invoice_created'
  | 'payment_recorded'
  | 'invoice_cancelled'
  | 'discount_applied'
  | 'item_price_modified'
  | 'refund_issued';

export interface AuditActor {
  id: string;
  name: string;
  role?: string;
}

export interface ValueDelta {
  field: string;
  before: unknown;
  after: unknown;
}

export interface AuditLogEntry {
  id: string;
  eventType: FinancialAuditEventType;
  entityType: 'invoice' | 'payment' | 'enquiry' | 'inventory';
  entityId: string;
  actor: AuditActor;
  timestamp: string; // ISO
  summary: string;
  deltas?: ValueDelta[];
}

/**
 * Creates a structured audit log entry with human-readable summary.
 */
export function createFinancialAuditEntry(
  eventType: FinancialAuditEventType,
  entityType: 'invoice' | 'payment' | 'enquiry' | 'inventory',
  entityId: string,
  actor: AuditActor,
  options: {
    amount?: number;
    reason?: string;
    deltas?: ValueDelta[];
    timestamp?: Date;
  } = {}
): AuditLogEntry {
  const ts = (options.timestamp || new Date()).toISOString();
  let summary = '';

  switch (eventType) {
    case 'invoice_created':
      summary = `${actor.name} created invoice #${entityId} for ₹${(options.amount || 0).toLocaleString()}`;
      break;
    case 'payment_recorded':
      summary = `${actor.name} recorded payment of ₹${(options.amount || 0).toLocaleString()} towards invoice #${entityId}`;
      break;
    case 'invoice_cancelled':
      summary = `${actor.name} cancelled invoice #${entityId}${options.reason ? ` (${options.reason})` : ''}`;
      break;
    case 'discount_applied':
      summary = `${actor.name} applied a discount of ₹${(options.amount || 0).toLocaleString()} to invoice #${entityId}`;
      break;
    case 'item_price_modified':
      summary = `${actor.name} modified item pricing on #${entityId}`;
      break;
    case 'refund_issued':
      summary = `${actor.name} processed a refund of ₹${(options.amount || 0).toLocaleString()} for #${entityId}`;
      break;
  }

  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType,
    entityType,
    entityId,
    actor,
    timestamp: ts,
    summary,
    deltas: options.deltas,
  };
}
