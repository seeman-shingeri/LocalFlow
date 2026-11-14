/**
 * Enterprise Bundle Size Optimization & Budget Auditor
 * Evaluates chunk distributions, verifies dynamic code splitting, and guards bundle budgets.
 */

export interface ChunkBudget {
  name: string;
  maxSizeBytes: number;
}

export interface ChunkInspection {
  name: string;
  sizeBytes: number;
}

export interface BudgetAuditResult {
  passed: boolean;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  violations: Array<{
    chunkName: string;
    actualBytes: number;
    budgetBytes: number;
    excessBytes: number;
  }>;
  chunks: Array<{
    name: string;
    sizeFormatted: string;
    withinBudget: boolean;
  }>;
}

export const ENTERPRISE_BUNDLE_BUDGETS: Record<string, number> = {
  'index.html': 5 * 1024, // 5 KB
  'react-vendor': 200 * 1024, // 200 KB
  'charts-vendor': 400 * 1024, // 400 KB
  'supabase-vendor': 250 * 1024, // 250 KB
  'ui-vendor': 100 * 1024, // 100 KB
  'date-vendor': 60 * 1024, // 60 KB
  'css-bundle': 60 * 1024, // 60 KB
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Audits compiled chunk sizes against enterprise performance budgets.
 */
export function auditBundleBudgets(
  chunks: ChunkInspection[],
  budgets: Record<string, number> = ENTERPRISE_BUNDLE_BUDGETS
): BudgetAuditResult {
  let totalBytes = 0;
  const violations: BudgetAuditResult['violations'] = [];
  const processedChunks: BudgetAuditResult['chunks'] = [];

  for (const chunk of chunks) {
    totalBytes += chunk.sizeBytes;
    const budget = budgets[chunk.name] ?? 150 * 1024; // Default 150KB for generic route chunk
    const withinBudget = chunk.sizeBytes <= budget;

    if (!withinBudget) {
      violations.push({
        chunkName: chunk.name,
        actualBytes: chunk.sizeBytes,
        budgetBytes: budget,
        excessBytes: chunk.sizeBytes - budget,
      });
    }

    processedChunks.push({
      name: chunk.name,
      sizeFormatted: formatBytes(chunk.sizeBytes),
      withinBudget,
    });
  }

  return {
    passed: violations.length === 0,
    totalSizeBytes: totalBytes,
    totalSizeFormatted: formatBytes(totalBytes),
    violations,
    chunks: processedChunks,
  };
}

/**
 * Verifies that key application modules are configured for dynamic asynchronous lazy loading.
 */
export function verifyLazyLoadedRoutes(routeConfigContent: string): {
  isFullyCodeSplit: boolean;
  missingRoutes: string[];
} {
  const criticalRoutes = [
    'DashboardPage',
    'CustomersPage',
    'EnquiriesPage',
    'AppointmentsPage',
    'InvoicesPage',
    'AIAssistantPage',
    'SettingsPage',
  ];

  const missingRoutes: string[] = [];

  for (const route of criticalRoutes) {
    const lazyPattern = new RegExp(`const\\s+${route}\\s*=\\s*lazy\\(`, 'i');
    if (!lazyPattern.test(routeConfigContent)) {
      missingRoutes.push(route);
    }
  }

  return {
    isFullyCodeSplit: missingRoutes.length === 0,
    missingRoutes,
  };
}
