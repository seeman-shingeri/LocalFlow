import { addDays, nextMonday, setHours, setMinutes, setSeconds, formatISO } from 'date-fns';

export type SnoozePreset = 'tomorrow' | 'in_3_days' | 'next_week' | 'next_monday';

export interface SnoozeOption {
  preset: SnoozePreset;
  label: string;
  targetDateIso: string;
}

/**
 * Calculates standardized follow-up snooze dates set to 9:00 AM local business time.
 */
export function calculateSnoozeDate(preset: SnoozePreset, baseDate: Date = new Date()): string {
  let target: Date;

  switch (preset) {
    case 'tomorrow':
      target = addDays(baseDate, 1);
      break;
    case 'in_3_days':
      target = addDays(baseDate, 3);
      break;
    case 'next_week':
      target = addDays(baseDate, 7);
      break;
    case 'next_monday':
      target = nextMonday(baseDate);
      break;
  }

  // Standardize callback time to 9:00 AM
  const standardized = setSeconds(setMinutes(setHours(target, 9), 0), 0);
  return formatISO(standardized);
}

/**
 * Returns available preset options with live computed target date strings.
 */
export function getAvailableSnoozeOptions(baseDate: Date = new Date()): SnoozeOption[] {
  return [
    {
      preset: 'tomorrow',
      label: 'Tomorrow (9 AM)',
      targetDateIso: calculateSnoozeDate('tomorrow', baseDate),
    },
    {
      preset: 'in_3_days',
      label: 'In 3 Days',
      targetDateIso: calculateSnoozeDate('in_3_days', baseDate),
    },
    {
      preset: 'next_week',
      label: 'Next Week',
      targetDateIso: calculateSnoozeDate('next_week', baseDate),
    },
    {
      preset: 'next_monday',
      label: 'Next Monday',
      targetDateIso: calculateSnoozeDate('next_monday', baseDate),
    },
  ];
}
