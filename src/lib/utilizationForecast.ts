import { Appointment } from '@/types/database';
import { addDays, format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export interface DailyForecastPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. 'Thu, Oct 22'
  activeEventBookingsCount: number;
  estimatedUnitsCommitted: number;
  utilizationRatePercent: number; // 0-100%
  capacityStatus: 'low_demand' | 'moderate' | 'peak_capacity';
}

/**
 * Projects daily equipment utilization for an upcoming window based on scheduled bookings.
 */
export function forecastDailyEquipmentUtilization(options: {
  totalFleetCapacity: number;
  appointments: Appointment[];
  daysAhead?: number;
  startDate?: Date;
  averageUnitsPerEvent?: number;
}): DailyForecastPoint[] {
  const {
    totalFleetCapacity,
    appointments = [],
    daysAhead = 7,
    startDate = new Date(),
    averageUnitsPerEvent = 50,
  } = options;

  const capacity = Math.max(1, totalFleetCapacity || 1);
  const forecast: DailyForecastPoint[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const currentDay = addDays(startDate, i);
    const dayStart = startOfDay(currentDay);
    const dayEnd = endOfDay(currentDay);
    const dateStr = format(currentDay, 'yyyy-MM-dd');
    const dayLabel = format(currentDay, 'EEE, MMM d');

    // Count scheduled appointments overlapping this day
    const overlapping = appointments.filter((apt) => {
      if (apt.status === 'cancelled') return false;
      try {
        const start = parseISO(apt.start_time);
        const end = parseISO(apt.end_time);

        // Check if dayStart..dayEnd overlaps with appointment start..end
        return (
          isWithinInterval(dayStart, { start, end }) ||
          isWithinInterval(dayEnd, { start, end }) ||
          isWithinInterval(start, { start: dayStart, end: dayEnd })
        );
      } catch {
        return false;
      }
    });

    const bookingsCount = overlapping.length;
    const estimatedCommitted = Math.min(capacity, bookingsCount * averageUnitsPerEvent);
    const utilizationRate = Math.min(
      100,
      Math.round((estimatedCommitted / capacity) * 100 * 10) / 10
    );

    let status: DailyForecastPoint['capacityStatus'] = 'low_demand';
    if (utilizationRate >= 80) status = 'peak_capacity';
    else if (utilizationRate >= 40) status = 'moderate';

    forecast.push({
      date: dateStr,
      dayLabel,
      activeEventBookingsCount: bookingsCount,
      estimatedUnitsCommitted: estimatedCommitted,
      utilizationRatePercent: utilizationRate,
      capacityStatus: status,
    });
  }

  return forecast;
}
