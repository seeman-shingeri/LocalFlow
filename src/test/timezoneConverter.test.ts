import { describe, it, expect } from 'vitest';
import {
  formatTimezone,
  toUtcIsoString,
  getTimezoneOffsetMinutes,
  isSameBusinessDay,
  getBusinessDayBounds,
} from '@/lib/timezoneConverter';

describe('Enterprise Timezone Consistency & IANA Date Converter (timezoneConverter)', () => {
  it('calculates standard +05:30 offset (+330 minutes) for Asia/Kolkata', () => {
    const offset = getTimezoneOffsetMinutes('Asia/Kolkata');
    expect(offset).toBe(330);
  });

  it('converts local Indian standard time (IST) to UTC ISO string accurately', () => {
    // 2026-11-18 10:30 IST -> 2026-11-18 05:00 UTC
    const utcIso = toUtcIsoString('2026-11-18', '10:30', 'Asia/Kolkata');
    expect(utcIso).toBe('2026-11-18T05:00:00.000Z');
  });

  it('formats UTC ISO timestamp into formatted local timezone representation', () => {
    const utcString = '2026-11-18T05:00:00.000Z';
    const formatted = formatTimezone(utcString, 'Asia/Kolkata', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    expect(formatted).toContain('10:30');
  });

  it('evaluates whether two timestamps belong to the same local business day', () => {
    // 2026-11-18 01:00 UTC is 06:30 IST (Nov 18)
    // 2026-11-18 17:00 UTC is 22:30 IST (Nov 18)
    const t1 = '2026-11-18T01:00:00.000Z';
    const t2 = '2026-11-18T17:00:00.000Z';
    expect(isSameBusinessDay(t1, t2, 'Asia/Kolkata')).toBe(true);

    // 2026-11-18 19:00 UTC is 00:30 IST (Nov 19)
    const t3 = '2026-11-18T19:00:00.000Z';
    expect(isSameBusinessDay(t1, t3, 'Asia/Kolkata')).toBe(false);
  });

  it('generates accurate business day start and end bounds in UTC', () => {
    const { startIso, endIso } = getBusinessDayBounds('2026-11-18', 'Asia/Kolkata');
    // Start of day in IST (00:00:00) is 18:30:00 UTC on the previous day
    expect(startIso).toBe('2026-11-17T18:30:00.000Z');
    expect(endIso).toBe('2026-11-18T18:29:59.000Z');
  });
});
