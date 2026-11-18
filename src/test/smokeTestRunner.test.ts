import { describe, it, expect, beforeEach } from 'vitest';
import { SmokeTestRunner } from '@/lib/smokeTestRunner';
import { localDb } from '@/lib/localStorageDb';

describe('Enterprise Post-Deployment Smoke Test Runner (smokeTestRunner)', () => {
  let runner: SmokeTestRunner;

  beforeEach(() => {
    localDb.resetAll();
    runner = new SmokeTestRunner();
  });

  it('runs all post-deployment smoke assertions and confirms readiness for live traffic', async () => {
    const report = await runner.runAllSmokeTests('ws-test-smoke');

    expect(report.isReadyForTraffic).toBe(true);
    expect(report.totalChecks).toBe(4);
    expect(report.passedCount).toBe(4);
    expect(report.failedCount).toBe(0);

    expect(report.steps.map((s) => s.name)).toEqual([
      'Database & Storage Baseline',
      'Customer Service Initialization',
      'Invoice Numbering & Calculation Service',
      'Appointment Conflict Detection Service',
    ]);
  });

  it('records execution duration for each smoke test step', async () => {
    const report = await runner.runAllSmokeTests();
    for (const step of report.steps) {
      expect(step.durationMs).toBeGreaterThanOrEqual(0);
      expect(step.passed).toBe(true);
    }
  });
});
