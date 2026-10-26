import { differenceInCalendarDays, parseISO } from 'date-fns';

export type RecencyStatus = 'active' | 'cooling_down' | 'dormant' | 'at_risk';

export interface CustomerEngagementHealth {
  customerId: string;
  daysSinceLastInteraction: number;
  status: RecencyStatus;
  churnRiskPercentage: number;
  needsAttention: boolean;
  recommendedAction: string;
}

/**
 * Calculates customer engagement health based on elapsed days since last touch or booking.
 */
export function evaluateCustomerRecency(
  customerId: string,
  lastInteractionDate: string | Date | null | undefined,
  totalLifetimeBookings: number = 0,
  referenceDate: Date = new Date()
): CustomerEngagementHealth {
  if (!lastInteractionDate) {
    return {
      customerId,
      daysSinceLastInteraction: 999,
      status: 'at_risk',
      churnRiskPercentage: 90,
      needsAttention: true,
      recommendedAction: 'No record of interaction. Initiate first introduction call or greeting.',
    };
  }

  const lastDate =
    typeof lastInteractionDate === 'string'
      ? parseISO(lastInteractionDate)
      : lastInteractionDate;

  const daysSince = Math.max(0, differenceInCalendarDays(referenceDate, lastDate));

  let status: RecencyStatus = 'active';
  let churnRisk = 10;
  let needsAttention = false;
  let recommendedAction = 'Relationship is healthy and active. Maintain standard check-ins.';

  if (daysSince > 180) {
    status = 'at_risk';
    churnRisk = totalLifetimeBookings > 3 ? 75 : 90;
    needsAttention = true;
    recommendedAction =
      'Client dormant over 6 months. Send exclusive festival package discount or re-engagement offer.';
  } else if (daysSince > 90) {
    status = 'dormant';
    churnRisk = 55;
    needsAttention = true;
    recommendedAction =
      'No touch in past 3 months. Schedule a quick check-in call to discover upcoming event plans.';
  } else if (daysSince > 30) {
    status = 'cooling_down';
    churnRisk = 30;
    needsAttention = false;
    recommendedAction = 'Client engagement cooling down. Share newly added rental inventory or catalog.';
  }

  return {
    customerId,
    daysSinceLastInteraction: daysSince,
    status,
    churnRiskPercentage: churnRisk,
    needsAttention,
    recommendedAction,
  };
}
