/**
 * LocalFlow AI — Enterprise Feature Flags & Gradual Rollout Engine
 *
 * Implements deterministic percentage-based rollouts, workspace tier feature-gating
 * (starter, pro, enterprise), and runtime developer/tester overrides.
 */

export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';

export interface FeatureFlagDefinition {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0 - 100
  allowedWorkspaces?: string[];
  requiredPlan?: SubscriptionPlan;
}

export interface EvaluationContext {
  workspaceId?: string;
  plan?: SubscriptionPlan;
}

const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlagDefinition> = new Map();
  private overrides: Map<string, boolean> = new Map();

  /**
   * Registers a feature flag.
   */
  register(flag: FeatureFlagDefinition): void {
    this.flags.set(flag.key, flag);
  }

  /**
   * Bulk registers an array of feature flags.
   */
  registerBulk(flags: FeatureFlagDefinition[]): void {
    flags.forEach((f) => this.register(f));
  }

  /**
   * Evaluates whether a flag is enabled for the provided context.
   */
  isEnabled(key: string, context: EvaluationContext = {}): boolean {
    // 1. Check runtime override
    if (this.overrides.has(key)) {
      return this.overrides.get(key)!;
    }

    const flag = this.flags.get(key);
    if (!flag) return false;

    // 2. Global switch
    if (!flag.enabled) return false;

    // 3. Explicit allowed workspaces list
    if (flag.allowedWorkspaces && flag.allowedWorkspaces.length > 0) {
      if (context.workspaceId && flag.allowedWorkspaces.includes(context.workspaceId)) {
        return true;
      }
      if (!flag.rolloutPercentage && !flag.requiredPlan) {
        return false;
      }
    }

    // 4. Plan tier gating
    if (flag.requiredPlan) {
      const userPlan = context.plan || 'starter';
      if (PLAN_HIERARCHY[userPlan] < PLAN_HIERARCHY[flag.requiredPlan]) {
        return false;
      }
    }

    // 5. Deterministic percentage rollout based on workspace ID
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      if (!context.workspaceId) {
        return flag.rolloutPercentage > 0;
      }
      const hash = this.hashString(`${key}:${context.workspaceId}`);
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Sets a temporary developer or test override.
   */
  setOverride(key: string, enabled: boolean): void {
    this.overrides.set(key, enabled);
  }

  /**
   * Clears overrides.
   */
  clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Returns list of all registered flags.
   */
  getAll(): FeatureFlagDefinition[] {
    return Array.from(this.flags.values());
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

export const featureFlagManager = new FeatureFlagManager();
