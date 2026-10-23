import { differenceInCalendarDays, parseISO } from 'date-fns';

export type FollowUpUrgencyLevel = 'critical' | 'high' | 'moderate' | 'low';

export interface FollowUpCandidate {
  id: string;
  dueDate: string | Date;
  priority?: 'urgent' | 'high' | 'medium' | 'low' | string;
  customerStatus?: string;
  associatedValue?: number;
}

export interface FollowUpUrgencyScore {
  followUpId: string;
  score: number;
  level: FollowUpUrgencyLevel;
  daysDiff: number; // positive = days overdue, negative = days remaining
  reasons: string[];
}

/**
 * Calculates a compound urgency heat score for scheduling follow-ups.
 */
export function calculateFollowUpUrgency(
  item: FollowUpCandidate,
  referenceDate: Date = new Date()
): FollowUpUrgencyScore {
  const due = typeof item.dueDate === 'string' ? parseISO(item.dueDate) : item.dueDate;
  const daysDiff = differenceInCalendarDays(referenceDate, due);

  let score = 20; // baseline
  const reasons: string[] = [];

  // Overdue scoring
  if (daysDiff > 0) {
    const overdueScore = Math.min(daysDiff * 15, 60);
    score += overdueScore;
    reasons.push(`${daysDiff} day(s) overdue (+${overdueScore} pts)`);
  } else if (daysDiff === 0) {
    score += 25;
    reasons.push('Due today (+25 pts)');
  } else if (daysDiff === -1) {
    score += 10;
    reasons.push('Due tomorrow (+10 pts)');
  }

  // Priority weighting
  const priority = (item.priority || 'medium').toLowerCase();
  if (priority === 'urgent') {
    score += 30;
    reasons.push('Urgent priority flag (+30 pts)');
  } else if (priority === 'high') {
    score += 20;
    reasons.push('High priority flag (+20 pts)');
  } else if (priority === 'low') {
    score -= 10;
    reasons.push('Low priority flag (-10 pts)');
  }

  // High-value deal boost
  if (item.associatedValue && item.associatedValue >= 50000) {
    score += 15;
    reasons.push(`High opportunity value ₹${item.associatedValue.toLocaleString()} (+15 pts)`);
  }

  // Determine categorical heat level
  let level: FollowUpUrgencyLevel = 'low';
  if (score >= 70) {
    level = 'critical';
  } else if (score >= 50) {
    level = 'high';
  } else if (score >= 30) {
    level = 'moderate';
  }

  return {
    followUpId: item.id,
    score: Math.max(0, score),
    level,
    daysDiff,
    reasons,
  };
}

/**
 * Sorts follow-ups by highest urgency heat score first.
 */
export function sortFollowUpsByUrgency(
  items: FollowUpCandidate[],
  referenceDate: Date = new Date()
): FollowUpUrgencyScore[] {
  return items
    .map((item) => calculateFollowUpUrgency(item, referenceDate))
    .sort((a, b) => b.score - a.score);
}
