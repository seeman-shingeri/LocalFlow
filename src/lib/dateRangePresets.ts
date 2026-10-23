import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  differenceInCalendarDays,
} from 'date-fns';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year';

export interface DateRangePeriod {
  preset: DateRangePreset;
  label: string;
  startDate: Date;
  endDate: Date;
  previousPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
};

/**
 * Computes exact start and end boundaries for dashboard filter intervals,
 * along with the matching previous period for period-over-period percentage comparison.
 */
export function getPresetDateRange(
  preset: DateRangePreset,
  referenceDate: Date = new Date()
): DateRangePeriod {
  let startDate: Date;
  let endDate: Date;

  switch (preset) {
    case 'today':
      startDate = startOfDay(referenceDate);
      endDate = endOfDay(referenceDate);
      break;

    case 'yesterday': {
      const yesterday = subDays(referenceDate, 1);
      startDate = startOfDay(yesterday);
      endDate = endOfDay(yesterday);
      break;
    }

    case 'this_week':
      startDate = startOfWeek(referenceDate, { weekStartsOn: 1 });
      endDate = endOfWeek(referenceDate, { weekStartsOn: 1 });
      break;

    case 'last_week': {
      const lastWeekDate = subWeeks(referenceDate, 1);
      startDate = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
      endDate = endOfWeek(lastWeekDate, { weekStartsOn: 1 });
      break;
    }

    case 'this_month':
      startDate = startOfMonth(referenceDate);
      endDate = endOfMonth(referenceDate);
      break;

    case 'last_month': {
      const lastMonthDate = subMonths(referenceDate, 1);
      startDate = startOfMonth(lastMonthDate);
      endDate = endOfMonth(lastMonthDate);
      break;
    }

    case 'this_quarter':
      startDate = startOfQuarter(referenceDate);
      endDate = endOfQuarter(referenceDate);
      break;

    case 'this_year':
      startDate = startOfYear(referenceDate);
      endDate = endOfYear(referenceDate);
      break;
  }

  // Calculate equivalent duration for previous period comparison
  const durationDays = differenceInCalendarDays(endDate, startDate) + 1;
  const prevEndDate = subDays(startDate, 1);
  const prevStartDate = subDays(prevEndDate, durationDays - 1);

  return {
    preset,
    label: PRESET_LABELS[preset],
    startDate,
    endDate,
    previousPeriod: {
      startDate: startOfDay(prevStartDate),
      endDate: endOfDay(prevEndDate),
    },
  };
}
