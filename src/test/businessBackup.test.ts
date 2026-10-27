import { describe, it, expect } from 'vitest';
import { generateBusinessBackup, validateBackupPayload } from '@/lib/businessBackup';

describe('JSON Business Backup Export & Validator (businessBackup)', () => {
  it('generates a full backup structure with verified record counts', () => {
    const backup = generateBusinessBackup('ws-101', {
      customers: [{ id: 'c-1', name: 'Ravi' }],
      invoices: [{ id: 'inv-1', total: 10000 }, { id: 'inv-2', total: 20000 }],
      inventory: [{ id: 'item-1', name: 'Tent' }],
    });

    expect(backup.metadata.workspaceId).toBe('ws-101');
    expect(backup.metadata.recordCounts.customers).toBe(1);
    expect(backup.metadata.recordCounts.invoices).toBe(2);
    expect(backup.metadata.recordCounts.inventory).toBe(1);
    expect(backup.metadata.recordCounts.appointments).toBe(0);
    expect(backup.metadata.totalRecords).toBe(4);
    expect(backup.data.customers).toHaveLength(1);
    expect(backup.data.invoices).toHaveLength(2);
  });

  it('validates a correct backup payload successfully', () => {
    const backup = generateBusinessBackup('ws-102', {
      customers: [{ id: 'c-1' }],
      invoices: [],
      inventory: [],
    });

    const result = validateBackupPayload(backup);
    expect(result.isValid).toBe(true);
    expect(result.totalRecords).toBe(1);
    expect(result.error).toBeUndefined();
  });

  it('rejects malformed backups missing metadata or essential tables', () => {
    const invalid = { data: { customers: 'not-an-array' } };
    const result = validateBackupPayload(invalid);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Missing metadata block');
  });
});
