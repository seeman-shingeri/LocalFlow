import { describe, it, expect } from 'vitest';
import { generateICalendarEvent } from '@/lib/icsExporter';

describe('Appointment iCalendar (.ics) File Export Generator (icsExporter)', () => {
  it('generates a valid RFC 5545 iCalendar payload', () => {
    const payload = {
      uid: 'apt-101@localflow.ai',
      title: 'Grand Palace Wedding Setup',
      description: 'Setup 40x60 tent, royal sofas, and audio truss.',
      location: 'Grand Palace, Hall A, Bengaluru',
      startTime: '2026-11-15T09:00:00',
      endTime: '2026-11-15T13:00:00',
      organizerName: 'LocalFlow Events',
      organizerEmail: 'support@localflow.ai',
      clientEmail: 'rajesh@example.com',
    };

    const ics = generateICalendarEvent(payload);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:apt-101@localflow.ai');
    expect(ics).toContain('SUMMARY:Grand Palace Wedding Setup');
    expect(ics).toContain('LOCATION:Grand Palace\\, Hall A\\, Bengaluru');
    expect(ics).toContain('TRIGGER:-PT60M');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('escapes commas, semicolons, and newlines properly', () => {
    const payload = {
      uid: 'apt-102',
      title: 'Party; Tent, Stage',
      description: 'Line 1\nLine 2',
      startTime: new Date(2026, 10, 20, 10, 0),
      endTime: new Date(2026, 10, 20, 12, 0),
    };

    const ics = generateICalendarEvent(payload);
    expect(ics).toContain('SUMMARY:Party\\; Tent\\, Stage');
    expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2');
  });
});
