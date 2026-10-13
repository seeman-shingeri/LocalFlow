import { describe, it, expect } from 'vitest';
import { isDateOverdue, isDateToday, filterFollowUps } from '../lib/utils';
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

describe('Follow-up Search and Priority Filtering', () => {
  const sampleFollowUps = [
    {
      title: 'Call back about roofing estimate',
      priority: 'high',
      notes: 'Customer requested discount on materials',
      customer: { name: 'Alice Walker' },
    },
    {
      title: 'Send invoice reminder',
      priority: 'medium',
      notes: 'Invoice #1004 is overdue',
      customer: { name: 'Bob Builders' },
    },
    {
      title: 'Check plumbing satisfaction',
      priority: 'low',
      notes: 'Standard 2-week checkin',
      customer: { name: 'Charlie Davis' },
    },
  ];

  it('filters follow-ups by priority level', () => {
    const highOnly = filterFollowUps(sampleFollowUps, '', 'high');
    expect(highOnly).toHaveLength(1);
    expect(highOnly[0].title).toBe('Call back about roofing estimate');

    const medOnly = filterFollowUps(sampleFollowUps, '', 'medium');
    expect(medOnly).toHaveLength(1);
    expect(medOnly[0].customer?.name).toBe('Bob Builders');
  });

  it('filters follow-ups by customer name keyword', () => {
    const filtered = filterFollowUps(sampleFollowUps, 'Alice', 'all');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain('roofing');
  });

  it('filters follow-ups by notes or title keyword case-insensitively', () => {
    const searchInvoice = filterFollowUps(sampleFollowUps, 'invoice', 'all');
    expect(searchInvoice).toHaveLength(1);
    expect(searchInvoice[0].customer?.name).toBe('Bob Builders');

    const searchDiscount = filterFollowUps(sampleFollowUps, 'discount', 'all');
    expect(searchDiscount).toHaveLength(1);
    expect(searchDiscount[0].customer?.name).toBe('Alice Walker');
  });

  it('combines search query and priority filter correctly', () => {
    const combinedMatch = filterFollowUps(sampleFollowUps, 'invoice', 'medium');
    expect(combinedMatch).toHaveLength(1);

    const combinedMismatch = filterFollowUps(sampleFollowUps, 'invoice', 'high');
    expect(combinedMismatch).toHaveLength(0);
  });
});
