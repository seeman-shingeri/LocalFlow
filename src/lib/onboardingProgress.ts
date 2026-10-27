export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  route: string;
  isCompleted: boolean;
}

export interface WorkspaceOnboardingStatus {
  hasProfile: boolean;
  inventoryCount: number;
  customerCount: number;
  invoiceCount: number;
  hasCustomSettings?: boolean;
}

export interface OnboardingProgressSummary {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  progressPercentage: number;
  isFullyOnboarded: boolean;
  nextStep: OnboardingStep | null;
}

/**
 * Calculates business onboarding setup progress and next best action for new accounts.
 */
export function calculateOnboardingProgress(
  status: WorkspaceOnboardingStatus
): OnboardingProgressSummary {
  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Complete Business Profile',
      description: 'Add your business name, contact phone, and GST identification number.',
      route: '/settings',
      isCompleted: Boolean(status.hasProfile),
    },
    {
      id: 'inventory',
      title: 'Add First Inventory Equipment',
      description: 'Catalog your tents, sound systems, or furniture items with rental pricing.',
      route: '/inventory',
      isCompleted: status.inventoryCount > 0,
    },
    {
      id: 'customer',
      title: 'Create First Customer Record',
      description: 'Add a client or event planner to start managing bookings.',
      route: '/customers',
      isCompleted: status.customerCount > 0,
    },
    {
      id: 'invoice',
      title: 'Generate First Estimate or Invoice',
      description: 'Issue an itemized quote or tax invoice with automatic PDF generation.',
      route: '/invoices',
      isCompleted: status.invoiceCount > 0,
    },
    {
      id: 'settings',
      title: 'Configure Operating Hours & Reminders',
      description: 'Set your team rigging hours and notification channels.',
      route: '/settings',
      isCompleted: Boolean(status.hasCustomSettings),
    },
  ];

  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);
  const isFullyOnboarded = completedCount === totalSteps;

  const nextStep = steps.find((s) => !s.isCompleted) || null;

  return {
    steps,
    completedCount,
    totalSteps,
    progressPercentage,
    isFullyOnboarded,
    nextStep,
  };
}
