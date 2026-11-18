/**
 * LocalFlow AI — Enterprise Data Integrity & Relational Consistency Auditor
 *
 * Scans relational entities (customers, invoices, payments, follow-ups)
 * to detect orphaned records, financial total discrepancies, overpayments,
 * and broken foreign key references.
 */

export type IntegritySeverity = 'critical' | 'warning' | 'info';

export interface IntegrityViolation {
  id: string;
  severity: IntegritySeverity;
  entityType: 'customer' | 'invoice' | 'payment' | 'follow_up' | 'appointment';
  entityId: string;
  rule: string;
  message: string;
}

export interface IntegrityAuditDataset {
  customers: Array<{ id: string; workspace_id: string }>;
  invoices: Array<{
    id: string;
    workspace_id: string;
    customer_id: string;
    subtotal: number;
    total_amount: number;
    items?: Array<{ unit_price: number; quantity: number }>;
  }>;
  payments: Array<{
    id: string;
    workspace_id: string;
    invoice_id: string;
    customer_id: string;
    amount: number;
  }>;
  followUps?: Array<{
    id: string;
    workspace_id: string;
    customer_id?: string;
  }>;
}

export interface IntegrityAuditReport {
  isHealthy: boolean;
  totalRecordsScanned: number;
  violations: IntegrityViolation[];
  summary: {
    criticalCount: number;
    warningCount: number;
  };
}

/**
 * Runs relational integrity audits on the provided workspace dataset.
 */
export function auditDataIntegrity(dataset: IntegrityAuditDataset): IntegrityAuditReport {
  const violations: IntegrityViolation[] = [];
  const customerIdSet = new Set(dataset.customers.map((c) => c.id));
  const invoiceMap = new Map(dataset.invoices.map((i) => [i.id, i]));

  let totalRecords = dataset.customers.length + dataset.invoices.length + dataset.payments.length;
  if (dataset.followUps) totalRecords += dataset.followUps.length;

  // 1. Audit Invoices
  for (const invoice of dataset.invoices) {
    // Check if customer exists
    if (!customerIdSet.has(invoice.customer_id)) {
      violations.push({
        id: `v-inv-cust-${invoice.id}`,
        severity: 'critical',
        entityType: 'invoice',
        entityId: invoice.id,
        rule: 'FOREIGN_KEY_ORPHAN',
        message: `Invoice references non-existent customer ID ${invoice.customer_id}`,
      });
    }

    // Check line item subtotal consistency
    if (invoice.items && invoice.items.length > 0) {
      const calculatedSubtotal = invoice.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );
      if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
        violations.push({
          id: `v-inv-subtotal-${invoice.id}`,
          severity: 'warning',
          entityType: 'invoice',
          entityId: invoice.id,
          rule: 'FINANCIAL_MISMATCH',
          message: `Invoice subtotal (${invoice.subtotal}) does not match sum of items (${calculatedSubtotal})`,
        });
      }
    }
  }

  // 2. Audit Payments
  const paymentSumsByInvoice = new Map<string, number>();

  for (const payment of dataset.payments) {
    const parentInvoice = invoiceMap.get(payment.invoice_id);

    if (!parentInvoice) {
      violations.push({
        id: `v-pay-inv-${payment.id}`,
        severity: 'critical',
        entityType: 'payment',
        entityId: payment.id,
        rule: 'ORPHANED_PAYMENT',
        message: `Payment references missing invoice ID ${payment.invoice_id}`,
      });
    } else {
      const currentSum = paymentSumsByInvoice.get(payment.invoice_id) || 0;
      paymentSumsByInvoice.set(payment.invoice_id, currentSum + payment.amount);
    }

    if (!customerIdSet.has(payment.customer_id)) {
      violations.push({
        id: `v-pay-cust-${payment.id}`,
        severity: 'warning',
        entityType: 'payment',
        entityId: payment.id,
        rule: 'UNKNOWN_CUSTOMER_PAYMENT',
        message: `Payment references unknown customer ID ${payment.customer_id}`,
      });
    }
  }

  // Check for overpaid invoices
  for (const [invoiceId, paidSum] of paymentSumsByInvoice.entries()) {
    const invoice = invoiceMap.get(invoiceId);
    if (invoice && paidSum > invoice.total_amount + 0.01) {
      violations.push({
        id: `v-inv-overpay-${invoiceId}`,
        severity: 'warning',
        entityType: 'invoice',
        entityId: invoiceId,
        rule: 'OVERPAYMENT_EXCESS',
        message: `Total payments (${paidSum}) exceed invoice total amount (${invoice.total_amount})`,
      });
    }
  }

  // 3. Audit Follow-Ups
  if (dataset.followUps) {
    for (const fu of dataset.followUps) {
      if (fu.customer_id && !customerIdSet.has(fu.customer_id)) {
        violations.push({
          id: `v-fu-cust-${fu.id}`,
          severity: 'warning',
          entityType: 'follow_up',
          entityId: fu.id,
          rule: 'ORPHANED_FOLLOW_UP',
          message: `Follow-up references deleted customer ID ${fu.customer_id}`,
        });
      }
    }
  }

  const criticalCount = violations.filter((v) => v.severity === 'critical').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;

  return {
    isHealthy: violations.length === 0,
    totalRecordsScanned: totalRecords,
    violations,
    summary: {
      criticalCount,
      warningCount,
    },
  };
}
