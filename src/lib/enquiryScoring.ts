import { Enquiry } from '@/types/database';
import { differenceInDays, parseISO } from 'date-fns';

export type EnquiryUrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export interface EnquiryScoreResult {
  score: number; // 0 to 100
  urgencyLevel: EnquiryUrgencyLevel;
  recommendedAction: string;
}

/**
 * Calculates a 0-100 score prioritizing enquiries by deal size, declared priority, age, and status.
 */
export function calculateEnquiryScore(enquiry: Enquiry): EnquiryScoreResult {
  if (enquiry.status === 'converted' || enquiry.status === 'not_converted') {
    return {
      score: 0,
      urgencyLevel: 'low',
      recommendedAction: enquiry.status === 'converted' ? 'Deal won' : 'Deal closed/lost',
    };
  }

  let points = 0;

  // 1. Estimated Deal Value (up to 40 points)
  const val = Number(enquiry.estimated_value) || 0;
  if (val >= 5000) points += 40;
  else if (val >= 2500) points += 30;
  else if (val >= 1000) points += 20;
  else if (val > 0) points += 10;

  // 2. Explicit Priority Level (up to 30 points)
  if (enquiry.priority === 'high') points += 30;
  else if (enquiry.priority === 'medium') points += 20;
  else points += 10;

  // 3. Status Recency / Pipeline Stage (up to 20 points)
  if (enquiry.status === 'new') points += 20; // untouched new lead needs instant contact
  else if (enquiry.status === 'contacted') points += 15;
  else if (enquiry.status === 'interested') points += 25; // hot prospect awaiting quote

  // 4. Age penalty / urgency boost (up to 10 points for fresh leads < 2 days old)
  try {
    const ageDays = Math.max(0, differenceInDays(new Date(), parseISO(enquiry.created_at)));
    if (ageDays <= 1) points += 10;
    else if (ageDays <= 3) points += 5;
  } catch {
    // fallback
  }

  const score = Math.min(100, Math.max(0, points));

  let urgencyLevel: EnquiryUrgencyLevel = 'low';
  let recommendedAction = 'Standard lead follow-up';

  if (score >= 75) {
    urgencyLevel = 'critical';
    recommendedAction = 'Call immediately — high value / urgent opportunity';
  } else if (score >= 50) {
    urgencyLevel = 'high';
    recommendedAction = 'Send customized rental proposal within 4 hours';
  } else if (score >= 30) {
    urgencyLevel = 'medium';
    recommendedAction = 'Follow up within 24 hours';
  }

  return {
    score,
    urgencyLevel,
    recommendedAction,
  };
}

/**
 * Sorts an array of enquiries in place or returns a new array ordered by urgency score descending.
 */
export function sortEnquiriesByUrgency(enquiries: Enquiry[]): Enquiry[] {
  return [...enquiries].sort((a, b) => {
    const scoreA = calculateEnquiryScore(a).score;
    const scoreB = calculateEnquiryScore(b).score;
    return scoreB - scoreA;
  });
}
