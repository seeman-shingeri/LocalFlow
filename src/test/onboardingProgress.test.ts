import { describe, it, expect } from 'vitest';
import { calculateOnboardingProgress } from '@/lib/onboardingProgress';

describe('Onboarding Setup Checklist Completion Calculator (onboardingProgress)', () => {
  it('computes 0% progress for newly registered empty account and guides to profile', () => {
    const res = calculateOnboardingProgress({
      hasProfile: false,
      inventoryCount: 0,
      customerCount: 0,
      invoiceCount: 0,
    });

    expect(res.completedCount).toBe(0);
    expect(res.progressPercentage).toBe(0);
    expect(res.isFullyOnboarded).toBe(false);
    expect(res.nextStep?.id).toBe('profile');
    expect(res.nextStep?.route).toBe('/settings');
  });

  it('accurately tracks partial progress and highlights the next pending step', () => {
    const res = calculateOnboardingProgress({
      hasProfile: true,
      inventoryCount: 15,
      customerCount: 0,
      invoiceCount: 0,
    });

    // Profile + Inventory completed = 2 / 5 (40%)
    expect(res.completedCount).toBe(2);
    expect(res.progressPercentage).toBe(40);
    expect(res.nextStep?.id).toBe('customer');
    expect(res.nextStep?.route).toBe('/customers');
  });

  it('marks 100% full onboarding when all steps are completed', () => {
    const res = calculateOnboardingProgress({
      hasProfile: true,
      inventoryCount: 50,
      customerCount: 10,
      invoiceCount: 5,
      hasCustomSettings: true,
    });

    expect(res.completedCount).toBe(5);
    expect(res.progressPercentage).toBe(100);
    expect(res.isFullyOnboarded).toBe(true);
    expect(res.nextStep).toBeNull();
  });
});
