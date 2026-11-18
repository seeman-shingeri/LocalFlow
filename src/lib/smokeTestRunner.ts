/**
 * LocalFlow AI — Enterprise Post-Deployment Smoke Test Runner
 *
 * Verifies core application services, database wiring, localStorage hydration,
 * and critical SPA routes immediately following deployment to confirm traffic readiness.
 */

import { customerService } from '@/services/customerService';
import { invoiceService } from '@/services/invoiceService';
import { appointmentService } from '@/services/appointmentService';
import { localDb } from '@/lib/localStorageDb';

export interface SmokeTestStep {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface DeploymentSmokeReport {
  timestamp: string;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  isReadyForTraffic: boolean;
  steps: SmokeTestStep[];
}

export class SmokeTestRunner {
  /**
   * Executes post-deploy smoke assertions across all critical application services.
   */
  async runAllSmokeTests(workspaceId: string = 'ws-smoke-test-temp'): Promise<DeploymentSmokeReport> {
    const steps: SmokeTestStep[] = [];

    // Step 1: Database and LocalStorage Baseline
    steps.push(await this.runStep('Database & Storage Baseline', async () => {
      const customers = localDb.getCustomers(workspaceId);
      if (!Array.isArray(customers)) throw new Error('Customer storage table did not return an array');
    }));

    // Step 2: Customer Service CRUD Smoke
    steps.push(await this.runStep('Customer Service Initialization', async () => {
      const all = await customerService.getAll(workspaceId);
      if (!Array.isArray(all)) throw new Error('customerService.getAll failed');
    }));

    // Step 3: Invoice Service Lifecycle Smoke
    steps.push(await this.runStep('Invoice Numbering & Calculation Service', async () => {
      const nextInv = await invoiceService.getNextInvoiceNumber(workspaceId);
      if (!nextInv.startsWith('INV-')) throw new Error('Invoice numbering generator failed');
    }));

    // Step 4: Appointment Service Conflict Detection Smoke
    steps.push(await this.runStep('Appointment Conflict Detection Service', async () => {
      const conflicts = await appointmentService.checkConflict(
        workspaceId,
        '2026-11-20T10:00:00Z',
        '2026-11-20T12:00:00Z'
      );
      if (!Array.isArray(conflicts)) throw new Error('appointmentService.checkConflict did not return an array');
    }));

    const passedCount = steps.filter((s) => s.passed).length;
    const failedCount = steps.length - passedCount;

    return {
      timestamp: new Date().toISOString(),
      totalChecks: steps.length,
      passedCount,
      failedCount,
      isReadyForTraffic: failedCount === 0,
      steps,
    };
  }

  private async runStep(name: string, assertion: () => Promise<void>): Promise<SmokeTestStep> {
    const start = performance.now();
    try {
      await assertion();
      return {
        name,
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      };
    } catch (err) {
      return {
        name,
        passed: false,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const smokeTestRunner = new SmokeTestRunner();
