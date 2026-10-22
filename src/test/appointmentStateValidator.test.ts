import { describe, it, expect } from 'vitest';
import {
  canTransitionAppointmentStatus,
  getAllowedNextStatuses,
} from '@/lib/appointmentStateValidator';
import { addDays, subDays } from 'date-fns';

describe('Appointment Status Transition Validator (appointmentStateValidator)', () => {
  it('allows scheduled appointments in past or today to be marked completed', () => {
    const pastStart = subDays(new Date(), 1).toISOString();
    const res = canTransitionAppointmentStatus('scheduled', 'completed', pastStart);
    expect(res.allowed).toBe(true);
    expect(res.reason).toBeUndefined();
  });

  it('rejects completing future scheduled appointments', () => {
    const futureStart = addDays(new Date(), 3).toISOString();
    const res = canTransitionAppointmentStatus('scheduled', 'completed', futureStart);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Cannot mark future scheduled events as completed');
  });

  it('disallows modifying terminal completed status', () => {
    const res = canTransitionAppointmentStatus('completed', 'cancelled');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Completed event bookings are closed');
  });

  it('requires cancelled appointments to be rescheduled first before completing', () => {
    const res = canTransitionAppointmentStatus('cancelled', 'completed');
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('must be rescheduled');

    const rescheduleAllowed = canTransitionAppointmentStatus('cancelled', 'rescheduled');
    expect(rescheduleAllowed.allowed).toBe(true);
  });

  it('returns allowed next status options correctly', () => {
    expect(getAllowedNextStatuses('scheduled')).toEqual(['completed', 'cancelled', 'rescheduled']);
    expect(getAllowedNextStatuses('completed')).toEqual([]);
    expect(getAllowedNextStatuses('cancelled')).toEqual(['rescheduled']);
  });
});
