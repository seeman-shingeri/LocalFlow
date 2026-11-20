import { describe, it, expect } from 'vitest';
import { auditProductionReadiness } from '@/lib/productionReadiness';

describe('Enterprise Production Readiness Auditor (productionReadiness)', () => {
  it('confirms launch readiness when all security and reliability gates are satisfied', () => {
    const report = auditProductionReadiness({
      environment: 'production',
      isHttps: true,
      hasSupabaseUrl: true,
      hasAnonKey: true,
      hasServiceRoleKeyExposed: false,
      apmActive: true,
      errorBoundaryActive: true,
      offlineQueueActive: true,
      auditTrailActive: true,
    });

    expect(report.isLaunchReady).toBe(true);
    expect(report.score).toBe(100);
    expect(report.criticalFailures).toBe(0);
    expect(report.passedCount).toBe(7);
    expect(report.failedCount).toBe(0);
  });

  it('blocks launch if critical HTTPS or secret exposure checks fail', () => {
    const report = auditProductionReadiness({
      environment: 'production',
      isHttps: false, // Insecure HTTP in production
      hasServiceRoleKeyExposed: true, // Leaked service key
    });

    expect(report.isLaunchReady).toBe(false);
    expect(report.criticalFailures).toBeGreaterThanOrEqual(1);

    const httpsCheck = report.checks.find((c) => c.id === 'sec-https');
    expect(httpsCheck?.passed).toBe(false);

    const secretCheck = report.checks.find((c) => c.id === 'sec-key-exposure');
    expect(secretCheck?.passed).toBe(false);
  });

  it('marks launch ready with warning if non-critical items fail in dev mode', () => {
    const report = auditProductionReadiness({
      environment: 'development',
      isHttps: false, // HTTP allowed in dev
      hasSupabaseUrl: false, // fallback to localDb
      hasAnonKey: false,
      errorBoundaryActive: true,
    });

    expect(report.criticalFailures).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(70);
  });
});
