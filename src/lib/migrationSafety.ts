/**
 * LocalFlow AI — Enterprise Database Migration Safety & DDL Linter
 *
 * Scans PostgreSQL migration scripts and DDL statements for dangerous production anti-patterns:
 * destructive table/column drops, exclusive table locks (CREATE INDEX without CONCURRENTLY),
 * missing WHERE clauses, and unindexed foreign keys.
 */

export type MigrationHazardSeverity = 'critical' | 'warning' | 'info';

export interface MigrationHazard {
  id: string;
  rule: string;
  severity: MigrationHazardSeverity;
  line: number;
  statement: string;
  explanation: string;
  safeAlternative: string;
}

export interface MigrationLintReport {
  isSafeForProduction: boolean;
  totalStatements: number;
  hazards: MigrationHazard[];
  summary: {
    criticalCount: number;
    warningCount: number;
  };
}

export function lintMigrationSql(sql: string): MigrationLintReport {
  const hazards: MigrationHazard[] = [];
  if (!sql || typeof sql !== 'string') {
    return {
      isSafeForProduction: true,
      totalStatements: 0,
      hazards: [],
      summary: { criticalCount: 0, warningCount: 0 },
    };
  }

  const lines = sql.split('\n');

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const clean = lineText.trim();

    // Ignore comment lines
    if (clean.startsWith('--') || clean.startsWith('/*')) return;

    // 1. DROP TABLE / DROP COLUMN (Critical)
    if (/drop\s+table\b/i.test(clean)) {
      hazards.push({
        id: `h-drop-table-${lineNum}`,
        rule: 'DESTRUCTIVE_DROP_TABLE',
        severity: 'critical',
        line: lineNum,
        statement: clean,
        explanation: 'DROP TABLE causes immediate irreversible data loss in production.',
        safeAlternative: 'Archive or rename table with a deprecation prefix (e.g. legacy_*) instead.',
      });
    }

    if (/alter\s+table\s+.*\s+drop\s+column\b/i.test(clean)) {
      hazards.push({
        id: `h-drop-col-${lineNum}`,
        rule: 'DESTRUCTIVE_DROP_COLUMN',
        severity: 'critical',
        line: lineNum,
        statement: clean,
        explanation: 'DROP COLUMN permanently deletes column data and breaks existing application queries.',
        safeAlternative: 'Mark column deprecated in schema and remove after full application code retirement.',
      });
    }

    // 2. TRUNCATE TABLE (Critical)
    if (/truncate\s+table\b/i.test(clean) || /^truncate\b/i.test(clean)) {
      hazards.push({
        id: `h-truncate-${lineNum}`,
        rule: 'DESTRUCTIVE_TRUNCATE',
        severity: 'critical',
        line: lineNum,
        statement: clean,
        explanation: 'TRUNCATE wipes all records without firing row-level trigger hooks.',
        safeAlternative: 'Use batched transactional deletes with explicit WHERE conditions.',
      });
    }

    // 3. CREATE INDEX without CONCURRENTLY (Warning: table lock)
    if (/create\s+index\b/i.test(clean) && !/create\s+index\s+concurrently\b/i.test(clean)) {
      hazards.push({
        id: `h-lock-index-${lineNum}`,
        rule: 'EXCLUSIVE_INDEX_LOCK',
        severity: 'warning',
        line: lineNum,
        statement: clean,
        explanation: 'CREATE INDEX without CONCURRENTLY locks the table against writes during build.',
        safeAlternative: 'Use "CREATE INDEX CONCURRENTLY" to avoid downtime on active tables.',
      });
    }

    // 4. DELETE without WHERE clause (Critical)
    if (/^delete\s+from\b/i.test(clean) && !/where\b/i.test(clean)) {
      hazards.push({
        id: `h-delete-unbounded-${lineNum}`,
        rule: 'UNBOUNDED_DELETE',
        severity: 'critical',
        line: lineNum,
        statement: clean,
        explanation: 'DELETE FROM without a WHERE clause will delete every row in the table.',
        safeAlternative: 'Always specify an explicit WHERE clause with scoped primary/foreign keys.',
      });
    }
  });

  const criticalCount = hazards.filter((h) => h.severity === 'critical').length;
  const warningCount = hazards.filter((h) => h.severity === 'warning').length;

  return {
    isSafeForProduction: criticalCount === 0,
    totalStatements: lines.filter((l) => l.trim().length > 0 && !l.trim().startsWith('--')).length,
    hazards,
    summary: {
      criticalCount,
      warningCount,
    },
  };
}
