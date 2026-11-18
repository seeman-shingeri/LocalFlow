import { describe, it, expect } from 'vitest';
import {
  generateBackupManifest,
  verifyBackupIntegrity,
  pruneBackupHistory,
  BackupManifest,
} from '@/lib/backupStrategy';

describe('Enterprise Database Backup Strategy (backupStrategy)', () => {
  it('generates a comprehensive backup manifest with checksum and record counts', () => {
    const sampleTables = {
      customers: [{ id: '1', name: 'Client A' }, { id: '2', name: 'Client B' }],
      invoices: [{ id: 'inv-1', total: 5000 }],
      inventory: [{ id: 'item-1', stock: 10 }],
    };

    const { manifest, payloadJson } = generateBackupManifest('ws-prod-1', sampleTables);

    expect(manifest.snapshotId).toMatch(/^snap-/);
    expect(manifest.totalRecords).toBe(4);
    expect(manifest.recordCounts.customers).toBe(2);
    expect(manifest.recordCounts.invoices).toBe(1);
    expect(manifest.payloadSizeBytes).toBeGreaterThan(0);
    expect(manifest.payloadChecksum).toMatch(/^bck-/);

    // Verify integrity succeeds on matching payload
    expect(verifyBackupIntegrity(manifest, payloadJson)).toBe(true);
  });

  it('detects payload tampering and rejects invalid checksum', () => {
    const { manifest } = generateBackupManifest('ws-1', { customers: [{ id: '1' }] });
    const tamperedPayload = JSON.stringify({ customers: [{ id: '1', malicious: true }] });

    expect(verifyBackupIntegrity(manifest, tamperedPayload)).toBe(false);
  });

  it('prunes historical snapshots according to retention policy', () => {
    const snapshots: BackupManifest[] = Array.from({ length: 15 }, (_, i) => ({
      snapshotId: `snap-${i}`,
      workspaceId: 'ws-1',
      createdAt: new Date(2026, 10, i + 1).toISOString(),
      schemaVersion: 1,
      recordCounts: {},
      totalRecords: 10,
      payloadChecksum: `hash-${i}`,
      payloadSizeBytes: 100,
    }));

    // Policy: keep 5 total
    const { retained, pruned } = pruneBackupHistory(snapshots, {
      maxDailySnapshots: 3,
      maxWeeklySnapshots: 2,
    });

    expect(retained).toHaveLength(5);
    expect(pruned).toHaveLength(10);
    // Retained should contain the newest snapshots
    expect(new Date(retained[0].createdAt).getTime()).toBeGreaterThan(
      new Date(retained[4].createdAt).getTime()
    );
  });
});
