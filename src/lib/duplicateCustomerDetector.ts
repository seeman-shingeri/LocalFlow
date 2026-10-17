import { Customer } from '@/types/database';

export interface DuplicateMatchResult {
  customer: Customer;
  matchScore: number; // 0 to 100
  matchReasons: string[];
}

/**
 * Strips punctuation and returns a set of normalized lowercase tokens.
 */
function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Calculates a match score (0 to 100) between two customer profiles.
 */
export function computeCustomerMatchScore(
  a: { name: string; email?: string | null; phone?: string | null },
  b: { name: string; email?: string | null; phone?: string | null }
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 1. Exact Email Match (Weight: 60)
  const emailA = a.email?.trim().toLowerCase();
  const emailB = b.email?.trim().toLowerCase();
  if (emailA && emailB && emailA === emailB) {
    score += 60;
    reasons.push('Identical email address');
  }

  // 2. Normalized Phone Match (Weight: 50)
  const phoneA = a.phone ? a.phone.replace(/[^\d]/g, '') : '';
  const phoneB = b.phone ? b.phone.replace(/[^\d]/g, '') : '';
  if (phoneA.length >= 7 && phoneB.length >= 7) {
    if (phoneA === phoneB || phoneA.endsWith(phoneB) || phoneB.endsWith(phoneA)) {
      score += 50;
      reasons.push('Matching telephone number');
    }
  }

  // 3. Name Similarity (Weight: up to 40)
  const nameA = a.name.trim().toLowerCase();
  const nameB = b.name.trim().toLowerCase();

  if (nameA === nameB) {
    score += 40;
    reasons.push('Exact full name match');
  } else {
    const tokensA = tokenizeName(nameA);
    const tokensB = tokenizeName(nameB);
    const sharedTokens = tokensA.filter((t) => tokensB.includes(t));

    if (sharedTokens.length > 0) {
      const tokenScore = Math.min(30, sharedTokens.length * 15);
      score += tokenScore;
      reasons.push(`Shared name components (${sharedTokens.join(', ')})`);
    }
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}

/**
 * Finds all potential duplicate customers in a list exceeding a match threshold (default: 45%).
 */
export function findPotentialCustomerDuplicates(
  candidate: { name: string; email?: string | null; phone?: string | null; id?: string },
  existingCustomers: Customer[],
  threshold: number = 45
): DuplicateMatchResult[] {
  const matches: DuplicateMatchResult[] = [];

  for (const existing of existingCustomers) {
    if (candidate.id && existing.id === candidate.id) continue;

    const { score, reasons } = computeCustomerMatchScore(candidate, existing);
    if (score >= threshold) {
      matches.push({
        customer: existing,
        matchScore: score,
        matchReasons: reasons,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}
