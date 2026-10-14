import { describe, it, expect } from 'vitest';
import {
  getCalendarDaysForMonth,
  getBookingsForDay,
} from '../components/appointment/EventBookingCalendar';
import { Appointment } from '../types/database';
import { format, parseISO } from 'date-fns';

describe('Event Booking Calendar Helper Functions', () => {
  const testMonth = new Date('2026-10-01T00:00:00Z');

  it('generates a full calendar grid covering complete weeks for the month', () => {
    const days = getCalendarDaysForMonth(testMonth);

    // October 2026 starts on Thursday and ends on Saturday
    // Complete weeks from Sunday Sept 27 to Saturday Oct 31 or Nov 7
    expect(days.length).toBeGreaterThanOrEqual(35);
    expect(days.length % 7).toBe(0); // Full 7-day weeks

    // First day should be Sunday
    expect(days[0].getDay()).toBe(0);
    // Last day should be Saturday
    expect(days[days.length - 1].getDay()).toBe(6);
  });

  it('accurately groups and retrieves bookings scheduled for a specific date', () => {
    const sampleAppointments: Appointment[] = [
      {
        id: 'apt-1',
        workspace_id: 'ws-1',
        customer_id: 'cust-1',
        title: 'Grand Wedding Shamiyana Setup',
        start_time: '2026-10-15T09:00:00Z',
        end_time: '2026-10-15T12:00:00Z',
        duration_minutes: 180,
        status: 'scheduled',
        location: 'Sunset Valley Grounds',
        notes: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'apt-2',
        workspace_id: 'ws-1',
        customer_id: 'cust-2',
        title: 'Corporate Tent Lighting Rigging',
        start_time: '2026-10-15T14:00:00Z',
        end_time: '2026-10-15T16:00:00Z',
        duration_minutes: 120,
        status: 'scheduled',
        location: 'Tech Park Plaza',
        notes: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'apt-3',
        workspace_id: 'ws-1',
        customer_id: 'cust-3',
        title: 'Banquet Chairs Delivery',
        start_time: '2026-10-20T10:00:00Z',
        end_time: '2026-10-20T11:00:00Z',
        duration_minutes: 60,
        status: 'completed',
        location: 'Community Hall',
        notes: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
    ];

    const targetDate = new Date('2026-10-15T12:00:00Z');
    const matchesOn15 = getBookingsForDay(sampleAppointments, targetDate);

    expect(matchesOn15).toHaveLength(2);
    expect(matchesOn15.map((a) => a.id)).toEqual(['apt-1', 'apt-2']);

    const otherDate = new Date('2026-10-20T08:00:00Z');
    const matchesOn20 = getBookingsForDay(sampleAppointments, otherDate);
    expect(matchesOn20).toHaveLength(1);
    expect(matchesOn20[0].title).toBe('Banquet Chairs Delivery');

    const emptyDate = new Date('2026-10-25T12:00:00Z');
    const matchesEmpty = getBookingsForDay(sampleAppointments, emptyDate);
    expect(matchesEmpty).toHaveLength(0);
  });

  it('handles invalid dates or empty lists gracefully without throwing', () => {
    const emptyResult = getBookingsForDay([], new Date());
    expect(emptyResult).toEqual([]);

    const malformedAppointment: Appointment = {
      id: 'apt-bad',
      workspace_id: 'ws-1',
      customer_id: 'cust-1',
      title: 'Bad Date Booking',
      start_time: 'invalid-iso-string',
      end_time: 'invalid-iso-string',
      duration_minutes: 30,
      status: 'scheduled',
      location: null,
      notes: null,
      created_at: '',
      updated_at: '',
    };

    expect(() => getBookingsForDay([malformedAppointment], new Date())).not.toThrow();
    expect(getBookingsForDay([malformedAppointment], new Date())).toEqual([]);
  });
});
