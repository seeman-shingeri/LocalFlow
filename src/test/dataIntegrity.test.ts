import { describe, it, expect } from 'vitest';
import { auditDataIntegrity, IntegrityAuditDataset } from '@/lib/dataIntegrity';

describe('Enterprise Data Integrity & Relational Consistency Auditor (dataIntegrity)', () => {
  it('reports healthy when all foreign keys and financial totals are consistent', () => {
    const dataset: IntegrityAuditDataset = {
      customers: [{ id: 'cust-1', workspace_id: 'ws-1' }],
      invoices: [
        {
          id: 'inv-1',
          workspace_id: 'ws-1',
          customer_id: 'cust-1',
          subtotal: 5000,
          total_amount: 5000,
          items: [{ unit_price: 2500, quantity: 2 }],
        },
      ],
      payments: [
        {
          id: 'pay-1',
          workspace_id: 'ws-1',
          invoice_id: 'inv-1',
          customer_id: 'cust-1',
          amount: 5000,
        },
      ],
      followUps: [{ id: 'fu-1', workspace_id: 'ws-1', customer_id: 'cust-1' }],
    };

    const report = auditDataIntegrity(dataset);
    expect(report.isHealthy).toBe(true);
    expect(report.violations).toHaveLength(0);
    expect(report.summary.criticalCount).toBe(0);
  });

  it('detects orphaned invoices referencing missing customers', () => {
    const dataset: IntegrityAuditDataset = {
      customers: [],
      invoices: [
        {
          id: 'inv-orphan',
          workspace_id: 'ws-1',
          customer_id: 'cust-deleted',
          subtotal: 1000,
          total_amount: 1000,
        },
      ],
      payments: [],
    };

    const report = auditDataIntegrity(dataset);
    expect(report.isHealthy).toBe(false);
    expect(report.summary.criticalCount).toBe(1);
    expect(report.violations[0].rule).toBe('FOREIGN_KEY_ORPHAN');
  });

  it('detects financial discrepancies between items and subtotal', () => {
    const dataset: IntegrityAuditDataset = {
      customers: [{ id: 'cust-1', workspace_id: 'ws-1' }],
      invoices: [
        {
          id: 'inv-mismatch',
          workspace_id: 'ws-1',
          customer_id: 'cust-1',
          subtotal: 10000, // Stated subtotal 10000
          total_amount: 10000,
          items: [{ unit_price: 3000, quantity: 2 }], // Calculated 6000
        },
      ],
      payments: [],
    };

    const report = auditDataIntegrity(dataset);
    expect(report.isHealthy).toBe(false);
    expect(report.violations.some((v) => v.rule === 'FINANCIAL_MISMATCH')).toBe(true);
  });

  it('detects overpayments exceeding invoice total amount', () => {
    const dataset: IntegrityAuditDataset = {
      customers: [{ id: 'cust-1', workspace_id: 'ws-1' }],
      invoices: [
        {
          id: 'inv-1',
          workspace_id: 'ws-1',
          customer_id: 'cust-1',
          subtotal: 5000,
          total_amount: 5000,
        },
      ],
      payments: [
        {
          id: 'pay-1',
          workspace_id: 'ws-1',
          invoice_id: 'inv-1',
          customer_id: 'cust-1',
          amount: 6000, // Overpayment by 1000
        },
      ],
    };

    const report = auditDataIntegrity(dataset);
    expect(report.isHealthy).toBe(false);
    expect(report.violations.some((v) => v.rule === 'OVERPAYMENT_EXCESS')).toBe(true);
  });
});
