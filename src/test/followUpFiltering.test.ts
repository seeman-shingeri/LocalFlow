import { describe, it, expect } from 'vitest';
import { isDateOverdue, isDateToday } from '../lib/utils';
import { subDays, addDays, format } from 'date-fns';

describe('Follow-up Date Categorization', () => {
  const now = new Date();

  it('correctly identifies dates from past days as overdue', () => {
    const yesterday = subDays(now, 1).toISOString();
    const lastWeek = subDays(now, 7).toISOString();

    expect(isDateOverdue(yesterday)).toBe(true);
    expect(isDateOverdue(lastWeek)).toBe(true);
  });

  it('correctly identifies today as due today and NOT overdue', () => {
    const todayMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString();
    const todayEvening = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0).toISOString();

    expect(isDateToday(todayMorning)).toBe(true);
    expect(isDateToday(todayEvening)).toBe(true);

    expect(isDateOverdue(todayMorning)).toBe(false);
    expect(isDateOverdue(todayEvening)).toBe(false);
  });

  it('correctly identifies future dates as neither overdue nor today', () => {
    const tomorrow = addDays(now, 1).toISOString();
    const nextMonth = addDays(now, 30).toISOString();

    expect(isDateOverdue(tomorrow)).toBe(false);
    expect(isDateToday(tomorrow)).toBe(false);

    expect(isDateOverdue(nextMonth)).toBe(false);
    expect(isDateToday(nextMonth)).toBe(false);
  });

  it('handles null and undefined dates safely', () => {
    expect(isDateOverdue(null)).toBe(false);
    expect(isDateOverdue(undefined)).toBe(false);
    expect(isDateToday(null)).toBe(false);
    expect(isDateToday(undefined)).toBe(false);
  });
});
