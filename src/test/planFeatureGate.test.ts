import { describe, it, expect } from 'vitest';
import { checkPlanFeatureAccess } from '@/lib/planFeatureGate';

describe('Workspace Subscription Plan Feature Gate (planFeatureGate)', () => {
  it('allows starter features but blocks growth features with upgrade prompt', () => {
    const csvAccess = checkPlanFeatureAccess('starter', 'csv_export');
    expect(csvAccess.allowed).toBe(true);

    const aiAccess = checkPlanFeatureAccess('starter', 'ai_assistant');
    expect(aiAccess.allowed).toBe(false);
    expect(aiAccess.upgradeRequired).toBe('growth');
    expect(aiAccess.message).toContain('upgrading to the growth plan');
  });

  it('enforces monthly invoice quotas and identifies when cap is hit', () => {
    const underCap = checkPlanFeatureAccess('starter', 'unlimited_invoices', 45);
    expect(underCap.allowed).toBe(true);

    const overCap = checkPlanFeatureAccess('starter', 'unlimited_invoices', 50);
    expect(overCap.allowed).toBe(false);
    expect(overCap.message).toContain('Monthly invoice limit (50) reached');
  });

  it('allows all features on enterprise plan', () => {
    const auditAccess = checkPlanFeatureAccess('enterprise', 'audit_logs');
    expect(auditAccess.allowed).toBe(true);

    const highUsage = checkPlanFeatureAccess('enterprise', 'unlimited_invoices', 10000);
    expect(highUsage.allowed).toBe(true);
  });
});
