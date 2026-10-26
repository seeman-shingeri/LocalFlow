import { describe, it, expect } from 'vitest';
import { humanizeEventDuration } from '@/lib/durationHumanizer';

describe('Event Booking Duration Formatter & Humanizer (durationHumanizer)', () => {
  it('formats same-day hourly event durations', () => {
    // 10:00 to 14:00 (4 hours)
    const start = new Date(2026, 9, 20, 10, 0);
    const end = new Date(2026, 9, 20, 14, 0);

    const res = humanizeEventDuration(start, end);

    expect(res.isSameDay).toBe(true);
    expect(res.totalHours).toBe(4);
    expect(res.billableDays).toBe(1);
    expect(res.shortLabel).toBe('4 hours');
    expect(res.detailedLabel).toContain('4 hours on 20 Oct 2026');
  });

  it('formats overnight event setups', () => {
    // Oct 20 18:00 to Oct 21 06:00
    const start = new Date(2026, 9, 20, 18, 0);
    const end = new Date(2026, 9, 21, 6, 0);

    const res = humanizeEventDuration(start, end);

    expect(res.isSameDay).toBe(false);
    expect(res.isOvernight).toBe(true);
    expect(res.shortLabel).toBe('Overnight (2 days)');
    expect(res.detailedLabel).toContain('Overnight: 20 Oct to 21 Oct 2026');
  });

  it('formats multi-day wedding and festival rental spans', () => {
    // Oct 20 to Oct 23 (4 calendar days)
    const start = new Date(2026, 9, 20, 9, 0);
    const end = new Date(2026, 9, 23, 18, 0);

    const res = humanizeEventDuration(start, end);

    expect(res.totalCalendarDays).toBe(4);
    expect(res.billableDays).toBe(4);
    expect(res.shortLabel).toBe('4 days');
    expect(res.detailedLabel).toContain('4 days (20 Oct – 23 Oct 2026)');
  });
});
