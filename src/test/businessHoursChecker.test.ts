import { describe, it, expect } from 'vitest';
import { checkOperationalHoursCompliance } from '@/lib/businessHoursChecker';

describe('Business Operational Hours Validator (businessHoursChecker)', () => {
  it('approves appointments scheduled within daytime operational hours (e.g. 10 AM to 6 PM)', () => {
    // Oct 23, 2026 (Friday), 10:00 to 18:00 local time
    const start = new Date(2026, 9, 23, 10, 0);
    const end = new Date(2026, 9, 23, 18, 0);

    const res = checkOperationalHoursCompliance(start, end);
    expect(res.compliant).toBe(true);
    expect(res.warning).toBeUndefined();
  });

  it('flags bookings that start too early (e.g. 4:00 AM)', () => {
    const start = new Date(2026, 9, 23, 4, 0); // 4 AM local
    const end = new Date(2026, 9, 23, 9, 0);

    const res = checkOperationalHoursCompliance(start, end, { earliestHour: 7 });
    expect(res.compliant).toBe(false);
    expect(res.warning).toContain('earlier than allowed operational hours');
  });

  it('flags bookings that run past allowed closing time (e.g. 11:30 PM)', () => {
    const start = new Date(2026, 9, 23, 18, 0);
    const end = new Date(2026, 9, 23, 23, 30); // 11:30 PM

    const res = checkOperationalHoursCompliance(start, end, { latestHour: 22 });
    expect(res.compliant).toBe(false);
    expect(res.warning).toContain('past allowed closing window');
  });

  it('enforces weekend restriction when configured', () => {
    // Oct 25, 2026 is Sunday
    const start = new Date(2026, 9, 25, 12, 0);
    const end = new Date(2026, 9, 25, 14, 0);

    const res = checkOperationalHoursCompliance(start, end, { allowWeekends: false });
    expect(res.compliant).toBe(false);
    expect(res.warning).toContain('weekends are restricted');
  });
});
