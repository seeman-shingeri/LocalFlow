export type SubscriptionPlan = 'starter' | 'growth' | 'enterprise';

export type GatedFeature =
  | 'csv_export'
  | 'multi_currency'
  | 'ai_assistant'
  | 'custom_branding'
  | 'unlimited_invoices'
  | 'team_seats'
  | 'audit_logs';

export interface PlanGateResult {
  allowed: boolean;
  limit?: number;
  current?: number;
  upgradeRequired?: SubscriptionPlan;
  message?: string;
}

const PLAN_LIMITS: Record<
  SubscriptionPlan,
  {
    allowedFeatures: Set<GatedFeature>;
    maxInvoicesPerMonth: number;
    maxTeamSeats: number;
  }
> = {
  starter: {
    allowedFeatures: new Set(['csv_export']),
    maxInvoicesPerMonth: 50,
    maxTeamSeats: 2,
  },
  growth: {
    allowedFeatures: new Set([
      'csv_export',
      'multi_currency',
      'ai_assistant',
      'custom_branding',
    ]),
    maxInvoicesPerMonth: 500,
    maxTeamSeats: 10,
  },
  enterprise: {
    allowedFeatures: new Set([
      'csv_export',
      'multi_currency',
      'ai_assistant',
      'custom_branding',
      'unlimited_invoices',
      'team_seats',
      'audit_logs',
    ]),
    maxInvoicesPerMonth: Infinity,
    maxTeamSeats: Infinity,
  },
};

/**
 * Checks if a feature or usage volume is permitted under the active subscription plan.
 */
export function checkPlanFeatureAccess(
  plan: SubscriptionPlan,
  feature: GatedFeature,
  currentUsage: number = 0
): PlanGateResult {
  const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;

  if (feature === 'unlimited_invoices') {
    const limit = planConfig.maxInvoicesPerMonth;
    if (currentUsage >= limit) {
      return {
        allowed: false,
        limit,
        current: currentUsage,
        upgradeRequired: plan === 'starter' ? 'growth' : 'enterprise',
        message: `Monthly invoice limit (${limit}) reached on the ${plan} plan. Upgrade to issue more invoices.`,
      };
    }
    return { allowed: true, limit, current: currentUsage };
  }

  if (feature === 'team_seats') {
    const limit = planConfig.maxTeamSeats;
    if (currentUsage >= limit) {
      return {
        allowed: false,
        limit,
        current: currentUsage,
        upgradeRequired: plan === 'starter' ? 'growth' : 'enterprise',
        message: `Maximum seat capacity of ${limit} reached for ${plan} plan.`,
      };
    }
    return { allowed: true, limit, current: currentUsage };
  }

  const isAllowed = planConfig.allowedFeatures.has(feature);
  if (!isAllowed) {
    const upgradeTier: SubscriptionPlan =
      feature === 'audit_logs' ? 'enterprise' : 'growth';

    return {
      allowed: false,
      upgradeRequired: upgradeTier,
      message: `The ${feature.replace(/_/g, ' ')} feature requires upgrading to the ${upgradeTier} plan.`,
    };
  }

  return { allowed: true };
}
