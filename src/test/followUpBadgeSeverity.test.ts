import { describe, it, expect } from 'vitest';
import { getFollowUpBadgeSeverity } from '@/lib/followUpBadgeSeverity';

describe('Overdue Follow-Up Badge Counter & Severity Indicator (followUpBadgeSeverity)', () => {
  it('returns critical severity and pulsing indicator for 4+ overdue tasks', () => {
    const config = getFollowUpBadgeSeverity(5, 2);

    expect(config.severity).toBe('critical');
    expect(config.shouldPulse).toBe(true);
    expect(config.badgeClass).toContain('bg-rose-500');
    expect(config.displayCount).toBe('7');
    expect(config.tooltip).toBe('5 overdue, 2 due today');
  });

  it('returns warning severity for 1 to 3 overdue tasks without pulse', () => {
    const config = getFollowUpBadgeSeverity(2, 0);

    expect(config.severity).toBe('warning');
    expect(config.shouldPulse).toBe(false);
    expect(config.badgeClass).toContain('bg-amber-500');
    expect(config.tooltip).toBe('2 overdue follow-ups');
  });

  it('clamps large numbers to 99+ display count', () => {
    const config = getFollowUpBadgeSeverity(150, 0);
    expect(config.displayCount).toBe('99+');
  });

  it('returns neutral severity for 0 pending tasks', () => {
    const config = getFollowUpBadgeSeverity(0, 0);
    expect(config.severity).toBe('none');
    expect(config.displayCount).toBe('0');
    expect(config.tooltip).toBe('No pending follow-ups');
  });
});
