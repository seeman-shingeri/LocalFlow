import { describe, it, expect } from 'vitest';
import {
  hasBufferedOverlap,
  findConflictingAppointments,
} from '@/lib/appointmentBuffer';

describe('Appointment Buffer & Conflict Detection (appointmentBuffer)', () => {
  // Slot: 10:00 to 12:00
  const slot1 = {
    start: '2026-10-20T10:00:00Z',
    end: '2026-10-20T12:00:00Z',
  };

  it('detects direct overlapping time slots without buffer', () => {
    // 11:00 to 13:00 overlaps with 10:00 to 12:00
    const slot2 = {
      start: '2026-10-20T11:00:00Z',
      end: '2026-10-20T13:00:00Z',
    };
    expect(hasBufferedOverlap(slot1, slot2, 0)).toBe(true);
  });

  it('reports no overlap for back-to-back appointments when buffer is 0', () => {
    // Exactly starts at 12:00 when slot1 ends
    const backToBack = {
      start: '2026-10-20T12:00:00Z',
      end: '2026-10-20T14:00:00Z',
    };
    expect(hasBufferedOverlap(slot1, backToBack, 0)).toBe(false);
  });

  it('detects conflict for back-to-back appointment when 30 min buffer is applied', () => {
    // 12:00 to 14:00 violates the 30-minute teardown/travel window around slot1 (ending at 12:00)
    const backToBack = {
      start: '2026-10-20T12:00:00Z',
      end: '2026-10-20T14:00:00Z',
    };
    expect(hasBufferedOverlap(slot1, backToBack, 30)).toBe(true);
  });

  it('finds conflicting appointment IDs while respecting self-exclusion', () => {
    const existing = [
      { id: 'apt-1', start_time: '2026-10-20T10:00:00Z', end_time: '2026-10-20T12:00:00Z' },
      { id: 'apt-2', start_time: '2026-10-20T15:00:00Z', end_time: '2026-10-20T17:00:00Z' },
    ];

    const candidate = {
      start: '2026-10-20T11:30:00Z',
      end: '2026-10-20T13:00:00Z',
    };

    const conflicts = findConflictingAppointments(candidate, existing, 0);
    expect(conflicts).toEqual(['apt-1']);

    // When excluding apt-1 (e.g. editing apt-1), no other conflict
    const excluded = findConflictingAppointments(candidate, existing, 0, 'apt-1');
    expect(excluded).toEqual([]);
  });
});
