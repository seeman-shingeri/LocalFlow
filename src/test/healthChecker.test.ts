import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthChecker } from '@/lib/healthChecker';

describe('Enterprise System Health Check Probe (healthChecker)', () => {
  let checker: HealthChecker;

  beforeEach(() => {
    localStorage.clear();
    checker = new HealthChecker();
  });

  it('reports healthy for storage subsystem write/read probe', () => {
    const storage = checker.checkStorage();
    expect(storage.status).toBe('healthy');
    expect(storage.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('runs complete health check and aggregates subsystem statuses', async () => {
    const report = await checker.runHealthCheck(async () => true);

    expect(report.overallStatus).toBe('healthy');
    expect(report.version).toBe('1.0.0');
    expect(report.subsystems.storage.status).toBe('healthy');
    expect(report.subsystems.database.status).toBe('healthy');
  });

  it('marks overall system unhealthy if database ping fails', async () => {
    const failingDbPing = async () => {
      throw new Error('Supabase 503 Service Unavailable');
    };

    const report = await checker.runHealthCheck(failingDbPing);
    expect(report.overallStatus).toBe('unhealthy');
    expect(report.subsystems.database.status).toBe('unhealthy');
    expect(report.subsystems.database.message).toContain('503 Service Unavailable');
  });

  it('marks overall system degraded if database returns false without throwing', async () => {
    const degradedDbPing = async () => false;

    const report = await checker.runHealthCheck(degradedDbPing);
    expect(report.overallStatus).toBe('degraded');
    expect(report.subsystems.database.status).toBe('degraded');
  });
});
