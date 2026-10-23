import { describe, it, expect } from 'vitest';
import { getPresetDateRange } from '@/lib/dateRangePresets';
import { format } from 'date-fns';

describe('Dashboard Period Range Date Interval Generator (dateRangePresets)', () => {
  const refDate = new Date(2026, 9, 15, 14, 30, 0); // Oct 15, 2026 (Thursday)

  it('generates exact boundaries for "today"', () => {
    const range = getPresetDateRange('today', refDate);
    expect(range.label).toBe('Today');
    expect(format(range.startDate, 'yyyy-MM-dd HH:mm:ss')).toBe('2026-10-15 00:00:00');
    expect(format(range.endDate, 'yyyy-MM-dd HH:mm:ss')).toBe('2026-10-15 23:59:59');

    // Previous period should be yesterday
    expect(format(range.previousPeriod.startDate, 'yyyy-MM-dd HH:mm:ss')).toBe('2026-10-14 00:00:00');
    expect(format(range.previousPeriod.endDate, 'yyyy-MM-dd HH:mm:ss')).toBe('2026-10-14 23:59:59');
  });

  it('generates exact boundaries for "this_month"', () => {
    const range = getPresetDateRange('this_month', refDate);
    expect(range.label).toBe('This Month');
    expect(format(range.startDate, 'yyyy-MM-dd')).toBe('2026-10-01');
    expect(format(range.endDate, 'yyyy-MM-dd')).toBe('2026-10-31');
  });

  it('generates exact boundaries for "last_week"', () => {
    const range = getPresetDateRange('last_week', refDate);
    expect(range.label).toBe('Last Week');
    // Week starting Monday Oct 5 to Sunday Oct 11, 2026
    expect(format(range.startDate, 'yyyy-MM-dd')).toBe('2026-10-05');
    expect(format(range.endDate, 'yyyy-MM-dd')).toBe('2026-10-11');
  });

  it('generates exact boundaries for "this_year"', () => {
    const range = getPresetDateRange('this_year', refDate);
    expect(range.label).toBe('This Year');
    expect(format(range.startDate, 'yyyy-MM-dd')).toBe('2026-01-01');
    expect(format(range.endDate, 'yyyy-MM-dd')).toBe('2026-12-31');
  });
});
