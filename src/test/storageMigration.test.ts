import { describe, it, expect } from 'vitest';
import { migrateStorageSchema, TARGET_STORAGE_VERSION } from '@/lib/storageMigration';

describe('LocalStorage Schema Versioning & Safe Migration Guard (storageMigration)', () => {
  it('migrates legacy v1 state to target version with default collection arrays and attributes', () => {
    const legacyState = {
      customers: [{ id: 'c-1', name: 'Ravi Verma' }],
      invoices: [{ id: 'inv-1', total: 50000, amount_paid: 20000 }],
    };

    const res = migrateStorageSchema(legacyState);

    expect(res.migrated).toBe(true);
    expect(res.initialVersion).toBe(1);
    expect(res.finalVersion).toBe(TARGET_STORAGE_VERSION);
    expect(res.data._schemaVersion).toBe(TARGET_STORAGE_VERSION);

    // Verify v2 customer migration
    const customer = (res.data.customers as any[])[0];
    expect(customer.is_archived).toBe(false);
    expect(customer.tags).toEqual([]);

    // Verify v3 invoice migration
    const invoice = (res.data.invoices as any[])[0];
    expect(invoice.balance).toBe(30000);
    expect(invoice.tax_rate).toBe(18);

    // Verify missing collections were initialized
    expect(res.data.inventory).toEqual([]);
    expect(res.data.appointments).toEqual([]);
  });

  it('handles corrupted or null state gracefully without throwing', () => {
    const res = migrateStorageSchema(null);

    expect(res.data._schemaVersion).toBe(TARGET_STORAGE_VERSION);
    expect(res.data.customers).toEqual([]);
    expect(res.data.invoices).toEqual([]);
  });

  it('leaves already up-to-date schema unmodified', () => {
    const current = {
      _schemaVersion: TARGET_STORAGE_VERSION,
      customers: [{ id: 'c-9', is_archived: false, tags: ['vip'] }],
    };

    const res = migrateStorageSchema(current);
    expect(res.migrated).toBe(false);
    expect(res.initialVersion).toBe(TARGET_STORAGE_VERSION);
  });
});
