import { parseISO, getHours, getMinutes, getDay } from 'date-fns';

export interface OperationalHoursConfig {
  earliestHour: number; // e.g. 7 (7:00 AM)
  latestHour: number;   // e.g. 22 (10:00 PM)
  allowWeekends: boolean;
}

export const DEFAULT_OPERATIONAL_CONFIG: OperationalHoursConfig = {
  earliestHour: 7,
  latestHour: 22,
  allowWeekends: true, // Events commonly operate on weekends
};

/**
 * Validates whether an event appointment falls within acceptable operating/rigging hours.
 */
export function checkOperationalHoursCompliance(
  startTime: string | Date,
  endTime: string | Date,
  config: Partial<OperationalHoursConfig> = {}
): { compliant: boolean; warning?: string } {
  const merged = { ...DEFAULT_OPERATIONAL_CONFIG, ...config };

  try {
    const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
    const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;

    const startDay = getDay(start);
    const isWeekend = startDay === 0 || startDay === 6; // Sunday = 0, Saturday = 6

    if (!merged.allowWeekends && isWeekend) {
      return {
        compliant: false,
        warning: 'Bookings on weekends are restricted under current business hours policy.',
      };
    }

    const startH = getHours(start);
    const endH = getHours(end);
    const endM = getMinutes(end);

    if (startH < merged.earliestHour) {
      return {
        compliant: false,
        warning: `Event start time (${startH}:00) is earlier than allowed operational hours (${merged.earliestHour}:00 AM).`,
      };
    }

    // If ends after latestHour (or exactly at latestHour with minutes > 0)
    if (endH > merged.latestHour || (endH === merged.latestHour && endM > 0)) {
      return {
        compliant: false,
        warning: `Event teardown/end time extends past allowed closing window (${merged.latestHour}:00).`,
      };
    }

    return { compliant: true };
  } catch {
    return { compliant: true };
  }
}
