import {
  differenceInMinutes,
  differenceInHours,
  differenceInCalendarDays,
  parseISO,
  format,
  isSameDay,
} from 'date-fns';

export interface DurationHumanizedResult {
  totalMinutes: number;
  totalHours: number;
  totalCalendarDays: number;
  billableDays: number;
  isOvernight: boolean;
  isSameDay: boolean;
  shortLabel: string;
  detailedLabel: string;
}

/**
 * Formats rental duration into humanized, professional display terms for event quotes and logistics.
 */
export function humanizeEventDuration(
  startInput: string | Date,
  endInput: string | Date
): DurationHumanizedResult {
  const start = typeof startInput === 'string' ? parseISO(startInput) : startInput;
  const end = typeof endInput === 'string' ? parseISO(endInput) : endInput;

  const totalMinutes = Math.max(0, differenceInMinutes(end, start));
  const totalHours = Math.max(0, differenceInHours(end, start));
  const sameDay = isSameDay(start, end);
  const calendarDays = Math.max(1, differenceInCalendarDays(end, start) + 1);

  // Billable days rule: If same day <= 12 hours = 1 day; > 24 hours rounded up per 24h block
  const billableDays = sameDay
    ? 1
    : Math.max(1, Math.ceil(totalMinutes / (24 * 60)));

  const isOvernight = !sameDay && calendarDays >= 2;

  let shortLabel = '';
  let detailedLabel = '';

  if (sameDay) {
    if (totalHours < 1) {
      shortLabel = `${totalMinutes} mins`;
      detailedLabel = `${totalMinutes} minutes (${format(start, 'p')} – ${format(end, 'p')})`;
    } else {
      const remainingMinutes = totalMinutes % 60;
      const hrStr = remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalHours} hours`;
      shortLabel = hrStr;
      detailedLabel = `${hrStr} on ${format(start, 'dd MMM yyyy')}`;
    }
  } else {
    const daysCount = differenceInCalendarDays(end, start);
    if (daysCount === 1) {
      shortLabel = 'Overnight (2 days)';
      detailedLabel = `Overnight: ${format(start, 'dd MMM')} to ${format(end, 'dd MMM yyyy')}`;
    } else {
      shortLabel = `${calendarDays} days`;
      detailedLabel = `${calendarDays} days (${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')})`;
    }
  }

  return {
    totalMinutes,
    totalHours,
    totalCalendarDays: calendarDays,
    billableDays,
    isOvernight,
    isSameDay: sameDay,
    shortLabel,
    detailedLabel,
  };
}
