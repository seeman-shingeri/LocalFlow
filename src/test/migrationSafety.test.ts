import { describe, it, expect } from 'vitest';
import { lintMigrationSql } from '@/lib/migrationSafety';

describe('Enterprise Database Migration Safety & DDL Linter (migrationSafety)', () => {
  it('flags destructive DROP TABLE and DROP COLUMN operations as critical hazards', () => {
    const dangerousSql = `
      -- Risky migration
      DROP TABLE old_invoices;
      ALTER TABLE customers DROP COLUMN legacy_phone;
    `;

    const report = lintMigrationSql(dangerousSql);
    expect(report.isSafeForProduction).toBe(false);
    expect(report.summary.criticalCount).toBe(2);
    expect(report.hazards.some((h) => h.rule === 'DESTRUCTIVE_DROP_TABLE')).toBe(true);
    expect(report.hazards.some((h) => h.rule === 'DESTRUCTIVE_DROP_COLUMN')).toBe(true);
  });

  it('flags CREATE INDEX without CONCURRENTLY as an exclusive lock warning', () => {
    const lockIndexSql = `
      CREATE INDEX idx_customers_email ON customers(email);
    `;

    const report = lintMigrationSql(lockIndexSql);
    // Warnings do not fail production safety by themselves, but are reported
    expect(report.summary.warningCount).toBe(1);
    expect(report.hazards[0].rule).toBe('EXCLUSIVE_INDEX_LOCK');
    expect(report.hazards[0].safeAlternative).toContain('CONCURRENTLY');
  });

  it('flags unbounded DELETE operations as critical hazard', () => {
    const unboundedDeleteSql = `
      DELETE FROM audit_logs;
    `;

    const report = lintMigrationSql(unboundedDeleteSql);
    expect(report.isSafeForProduction).toBe(false);
    expect(report.hazards.some((h) => h.rule === 'UNBOUNDED_DELETE')).toBe(true);
  });

  it('passes safe migrations using ADD COLUMN with NULL, CREATE INDEX CONCURRENTLY, and WHERE clauses', () => {
    const safeSql = `
      -- Safe non-blocking migration
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier text;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tier ON customers(tier);
      DELETE FROM sessions WHERE expires_at < now();
    `;

    const report = lintMigrationSql(safeSql);
    expect(report.isSafeForProduction).toBe(true);
    expect(report.summary.criticalCount).toBe(0);
    expect(report.summary.warningCount).toBe(0);
    expect(report.hazards).toHaveLength(0);
  });
});
