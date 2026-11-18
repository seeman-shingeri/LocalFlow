import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagManager } from '@/lib/featureFlags';

describe('Enterprise Feature Flags & Gradual Rollout Engine (featureFlags)', () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    manager = new FeatureFlagManager();
  });

  it('evaluates global enabled status for basic flags', () => {
    manager.register({
      key: 'dark_mode',
      description: 'Enable dark theme',
      enabled: true,
    });

    manager.register({
      key: 'legacy_export',
      description: 'Old export method',
      enabled: false,
    });

    expect(manager.isEnabled('dark_mode')).toBe(true);
    expect(manager.isEnabled('legacy_export')).toBe(false);
    expect(manager.isEnabled('unregistered_flag')).toBe(false);
  });

  it('gates features based on workspace subscription plan hierarchy', () => {
    manager.register({
      key: 'ai_quotation_assistant',
      description: 'AI Quote Builder',
      enabled: true,
      requiredPlan: 'pro',
    });

    // Starter plan cannot access pro feature
    expect(manager.isEnabled('ai_quotation_assistant', { plan: 'starter' })).toBe(false);

    // Pro and Enterprise plans have access
    expect(manager.isEnabled('ai_quotation_assistant', { plan: 'pro' })).toBe(true);
    expect(manager.isEnabled('ai_quotation_assistant', { plan: 'enterprise' })).toBe(true);
  });

  it('grants immediate access to explicitly whitelisted workspaces', () => {
    manager.register({
      key: 'beta_upi_gateway',
      description: 'Beta Payment Gateway',
      enabled: true,
      allowedWorkspaces: ['ws-beta-tester-1'],
    });

    expect(manager.isEnabled('beta_upi_gateway', { workspaceId: 'ws-beta-tester-1' })).toBe(true);
    expect(manager.isEnabled('beta_upi_gateway', { workspaceId: 'ws-regular-customer' })).toBe(false);
  });

  it('allows manual runtime overrides to supersede rules', () => {
    manager.register({
      key: 'experimental_feature',
      description: 'Under development',
      enabled: false,
    });

    expect(manager.isEnabled('experimental_feature')).toBe(false);

    manager.setOverride('experimental_feature', true);
    expect(manager.isEnabled('experimental_feature')).toBe(true);

    manager.clearOverrides();
    expect(manager.isEnabled('experimental_feature')).toBe(false);
  });
});
