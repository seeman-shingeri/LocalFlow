import { describe, it, expect } from 'vitest';
import {
  calculateFollowUpUrgency,
  sortFollowUpsByUrgency,
  FollowUpCandidate,
} from '@/lib/followUpUrgency';

describe('Follow-Up Urgency Heat Score Calculator (followUpUrgency)', () => {
  const refDate = new Date(2026, 9, 20); // Reference Date

  it('calculates critical urgency for overdue urgent follow-ups', () => {
    const item: FollowUpCandidate = {
      id: 'f-1',
      dueDate: new Date(2026, 9, 17), // 3 days overdue
      priority: 'urgent',
      associatedValue: 75000,
    };

    const res = calculateFollowUpUrgency(item, refDate);
    // Baseline 20 + 3*15 (45) + urgent (30) + high value (15) = 110
    expect(res.score).toBeGreaterThanOrEqual(70);
    expect(res.level).toBe('critical');
    expect(res.daysDiff).toBe(3);
    expect(res.reasons.length).toBeGreaterThan(2);
  });

  it('assigns moderate or low urgency for future low-priority tasks', () => {
    const item: FollowUpCandidate = {
      id: 'f-2',
      dueDate: new Date(2026, 9, 28), // 8 days in future
      priority: 'low',
    };

    const res = calculateFollowUpUrgency(item, refDate);
    // 20 - 10 = 10
    expect(res.score).toBe(10);
    expect(res.level).toBe('low');
  });

  it('ranks overdue items higher than future appointments in a list', () => {
    const list: FollowUpCandidate[] = [
      { id: 'future', dueDate: new Date(2026, 9, 25), priority: 'low' },
      { id: 'today', dueDate: new Date(2026, 9, 20), priority: 'medium' },
      { id: 'overdue-urgent', dueDate: new Date(2026, 9, 18), priority: 'urgent' },
    ];

    const sorted = sortFollowUpsByUrgency(list, refDate);
    expect(sorted[0].followUpId).toBe('overdue-urgent');
    expect(sorted[1].followUpId).toBe('today');
    expect(sorted[2].followUpId).toBe('future');
  });
});
