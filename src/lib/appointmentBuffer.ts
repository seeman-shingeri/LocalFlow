import { parseISO, subMinutes, addMinutes, isBefore, isAfter, isEqual } from 'date-fns';

export interface TimeSlot {
  start: string | Date;
  end: string | Date;
}

/**
 * Checks whether two appointments overlap, optionally adding buffer minutes around the existing slot.
 */
export function hasBufferedOverlap(
  slotA: TimeSlot,
  slotB: TimeSlot,
  bufferMinutes: number = 0
): boolean {
  try {
    const startA = typeof slotA.start === 'string' ? parseISO(slotA.start) : slotA.start;
    const endA = typeof slotA.end === 'string' ? parseISO(slotA.end) : slotA.end;

    let startB = typeof slotB.start === 'string' ? parseISO(slotB.start) : slotB.start;
    let endB = typeof slotB.end === 'string' ? parseISO(slotB.end) : slotB.end;

    if (bufferMinutes > 0) {
      startB = subMinutes(startB, bufferMinutes);
      endB = addMinutes(endB, bufferMinutes);
    }

    // Overlap occurs if A starts before B ends AND A ends after B starts
    const aStartsBeforeBEnds = isBefore(startA, endB);
    const aEndsAfterBStarts = isAfter(endA, startB);

    return aStartsBeforeBEnds && aEndsAfterBStarts;
  } catch {
    return false;
  }
}

/**
 * Finds all conflicting appointment IDs in a list of existing bookings with buffer consideration.
 */
export function findConflictingAppointments(
  candidate: TimeSlot,
  existing: Array<{ id: string; start_time: string; end_time: string }>,
  bufferMinutes: number = 0,
  excludeId?: string
): string[] {
  const conflictingIds: string[] = [];

  for (const item of existing) {
    if (excludeId && item.id === excludeId) continue;

    if (
      hasBufferedOverlap(
        candidate,
        { start: item.start_time, end: item.end_time },
        bufferMinutes
      )
    ) {
      conflictingIds.push(item.id);
    }
  }

  return conflictingIds;
}
