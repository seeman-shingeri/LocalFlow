import { AppointmentStatus } from '@/types/database';
import { isAfter, parseISO } from 'date-fns';

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ['completed', 'cancelled', 'rescheduled'],
  rescheduled: ['completed', 'cancelled'],
  completed: [], // Terminal state - completed jobs cannot be arbitrarily reopened
  cancelled: ['rescheduled'], // Cancelled jobs must be explicitly rescheduled first
};

/**
 * Validates whether an appointment can legally transition from currentStatus to targetStatus.
 */
export function canTransitionAppointmentStatus(
  currentStatus: AppointmentStatus,
  targetStatus: AppointmentStatus,
  startTime?: string | null
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(targetStatus)) {
    if (currentStatus === 'completed') {
      return {
        allowed: false,
        reason: 'Completed event bookings are closed and cannot be changed.',
      };
    }
    if (currentStatus === 'cancelled' && targetStatus === 'completed') {
      return {
        allowed: false,
        reason: 'Cancelled event bookings must be rescheduled before being marked complete.',
      };
    }
    return {
      allowed: false,
      reason: `Cannot transition appointment from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  // Business sanity rule: Cannot complete an appointment whose start time is in the future
  if (targetStatus === 'completed' && startTime) {
    try {
      const start = parseISO(startTime);
      if (isAfter(start, new Date())) {
        return {
          allowed: false,
          reason: 'Cannot mark future scheduled events as completed before they begin.',
        };
      }
    } catch {
      // fallback
    }
  }

  return { allowed: true };
}

/**
 * Returns available next status options for UI buttons/dropdowns.
 */
export function getAllowedNextStatuses(currentStatus: AppointmentStatus): AppointmentStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}
