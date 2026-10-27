export type BadgeSeverity = 'none' | 'warning' | 'critical';

export interface FollowUpBadgeConfig {
  overdueCount: number;
  dueTodayCount: number;
  totalAttentionNeeded: number;
  severity: BadgeSeverity;
  displayCount: string;
  badgeClass: string;
  tooltip: string;
  ariaLabel: string;
  shouldPulse: boolean;
}

/**
 * Computes badge styling and severity indicators for follow-up reminders in UI navigation.
 */
export function getFollowUpBadgeSeverity(
  overdueCount: number,
  dueTodayCount: number = 0
): FollowUpBadgeConfig {
  const safeOverdue = Math.max(0, overdueCount);
  const safeToday = Math.max(0, dueTodayCount);
  const total = safeOverdue + safeToday;

  let severity: BadgeSeverity = 'none';
  let badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  let shouldPulse = false;

  if (safeOverdue >= 4) {
    severity = 'critical';
    badgeClass = 'bg-rose-500 text-white animate-pulse shadow-sm';
    shouldPulse = true;
  } else if (safeOverdue > 0) {
    severity = 'warning';
    badgeClass = 'bg-amber-500 text-white';
  } else if (safeToday > 0) {
    severity = 'warning';
    badgeClass = 'bg-blue-500 text-white';
  }

  const displayCount = total > 99 ? '99+' : total.toString();

  let tooltip = 'No pending follow-ups';
  if (safeOverdue > 0 && safeToday > 0) {
    tooltip = `${safeOverdue} overdue, ${safeToday} due today`;
  } else if (safeOverdue > 0) {
    tooltip = `${safeOverdue} overdue follow-up${safeOverdue > 1 ? 's' : ''}`;
  } else if (safeToday > 0) {
    tooltip = `${safeToday} follow-up${safeToday > 1 ? 's' : ''} scheduled today`;
  }

  const ariaLabel = `${tooltip}. Requires attention.`;

  return {
    overdueCount: safeOverdue,
    dueTodayCount: safeToday,
    totalAttentionNeeded: total,
    severity,
    displayCount,
    badgeClass,
    tooltip,
    ariaLabel,
    shouldPulse,
  };
}
