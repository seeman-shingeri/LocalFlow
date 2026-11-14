import { describe, it, expect } from 'vitest';
import { auditBundleBudgets, verifyLazyLoadedRoutes, formatBytes } from '@/lib/bundleOptimizer';
import fs from 'fs';
import path from 'path';

describe('Enterprise Bundle Size Optimization & Budget Auditor (bundleOptimizer)', () => {
  it('formats byte metrics into clean human-readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(150 * 1024)).toBe('150 KB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('validates chunks against performance budgets and reports violations', () => {
    const chunks = [
      { name: 'react-vendor', sizeBytes: 160 * 1024 }, // within 200KB budget
      { name: 'date-vendor', sizeBytes: 25 * 1024 }, // within 60KB budget
      { name: 'ui-vendor', sizeBytes: 150 * 1024 }, // exceeds 100KB budget!
    ];

    const audit = auditBundleBudgets(chunks);

    expect(audit.passed).toBe(false);
    expect(audit.violations).toHaveLength(1);
    expect(audit.violations[0].chunkName).toBe('ui-vendor');
    expect(audit.violations[0].excessBytes).toBe(50 * 1024);
  });

  it('passes when all assets satisfy enterprise performance thresholds', () => {
    const chunks = [
      { name: 'react-vendor', sizeBytes: 160 * 1024 },
      { name: 'charts-vendor', sizeBytes: 370 * 1024 },
      { name: 'supabase-vendor', sizeBytes: 220 * 1024 },
      { name: 'date-vendor', sizeBytes: 25 * 1024 },
    ];

    const audit = auditBundleBudgets(chunks);
    expect(audit.passed).toBe(true);
    expect(audit.violations).toHaveLength(0);
  });

  it('confirms all critical application routes in App.tsx are dynamically lazy-loaded', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    const result = verifyLazyLoadedRoutes(appContent);

    expect(result.isFullyCodeSplit).toBe(true);
    expect(result.missingRoutes).toHaveLength(0);
  });
});
