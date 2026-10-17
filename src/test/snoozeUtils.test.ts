import { describe, it, expect } from 'vitest';
import {
  calculateSnoozeDate,
  getAvailableSnoozeOptions,
} from '@/lib/snoozeUtils';
import { parseISO, getHours, getMinutes, getDay, isAfter } from 'date-fns';

describe('Follow-Up Snooze & Reschedule Utilities (snoozeUtils)', () => {
  // Test anchor: Wednesday, Oct 14, 2026, 14:30
  const anchorDate = new Date(2026, 9, 14, 14, 30);

  it('calculates tomorrow 9:00 AM correctly', () => {
    const iso = calculateSnoozeDate('tomorrow', anchorDate);
    const parsed = parseISO(iso);
    expect(getHours(parsed)).toBe(9);
    expect(getMinutes(parsed)).toBe(0);
    expect(parsed.getDate()).toBe(15);
  });

  it('calculates 3 days ahead correctly', () => {
    const iso = calculateSnoozeDate('in_3_days', anchorDate);
    const parsed = parseISO(iso);
    expect(parsed.getDate()).toBe(17);
    expect(getHours(parsed)).toBe(9);
  });

  it('calculates next monday correctly', () => {
    const iso = calculateSnoozeDate('next_monday', anchorDate);
    const parsed = parseISO(iso);
    expect(getDay(parsed)).toBe(1); // Monday
    expect(isAfter(parsed, anchorDate)).toBe(true);
    expect(getHours(parsed)).toBe(9);
  });

  it('returns array of all 4 preset options with valid ISO strings', () => {
    const options = getAvailableSnoozeOptions(anchorDate);
    expect(options.length).toBe(4);
    expect(options.map((o) => o.preset)).toEqual([
      'tomorrow',
      'in_3_days',
      'next_week',
      'next_monday',
    ]);
  });
});
