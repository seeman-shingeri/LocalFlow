import { Enquiry } from '@/types/database';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';

export interface VelocityBucket {
  range: '< 24 Hours' | '1–7 Days' | '8–30 Days' | '30+ Days';
  count: number;
  percentage: number;
}

export interface ConversionVelocityMetrics {
  totalConverted: number;
  averageDaysToConversion: number;
  medianDaysToConversion: number;
  fastestConversionHours: number;
  slowestConversionDays: number;
  distribution: VelocityBucket[];
}

/**
 * Calculates conversion speed metrics and distribution for closed-won enquiries.
 */
export function calculateConversionVelocity(enquiries: Enquiry[]): ConversionVelocityMetrics {
  const converted = enquiries.filter((e) => e.status === 'converted');

  if (converted.length === 0) {
    return {
      totalConverted: 0,
      averageDaysToConversion: 0,
      medianDaysToConversion: 0,
      fastestConversionHours: 0,
      slowestConversionDays: 0,
      distribution: [
        { range: '< 24 Hours', count: 0, percentage: 0 },
        { range: '1–7 Days', count: 0, percentage: 0 },
        { range: '8–30 Days', count: 0, percentage: 0 },
        { range: '30+ Days', count: 0, percentage: 0 },
      ],
    };
  }

  const durationsHours: number[] = [];
  const durationsDays: number[] = [];

  const counts = {
    under24h: 0,
    oneToSeven: 0,
    eightToThirty: 0,
    overThirty: 0,
  };

  converted.forEach((e) => {
    try {
      const created = parseISO(e.created_at);
      const updated = parseISO(e.updated_at);
      const hours = Math.max(0, differenceInHours(updated, created));
      const days = Math.max(0, differenceInDays(updated, created));

      durationsHours.push(hours);
      durationsDays.push(days);

      if (hours < 24) {
        counts.under24h++;
      } else if (days <= 7) {
        counts.oneToSeven++;
      } else if (days <= 30) {
        counts.eightToThirty++;
      } else {
        counts.overThirty++;
      }
    } catch {
      // fallback
    }
  });

  const total = durationsDays.length;
  const avgDays = total > 0 ? durationsDays.reduce((a, b) => a + b, 0) / total : 0;

  // Calculate median days
  const sortedDays = [...durationsDays].sort((a, b) => a - b);
  const mid = Math.floor(sortedDays.length / 2);
  const medianDays =
    sortedDays.length % 2 !== 0
      ? sortedDays[mid]
      : sortedDays.length > 0
      ? (sortedDays[mid - 1] + sortedDays[mid]) / 2
      : 0;

  const fastestHours = durationsHours.length > 0 ? Math.min(...durationsHours) : 0;
  const slowestDays = durationsDays.length > 0 ? Math.max(...durationsDays) : 0;

  return {
    totalConverted: total,
    averageDaysToConversion: Math.round(avgDays * 10) / 10,
    medianDaysToConversion: Math.round(medianDays * 10) / 10,
    fastestConversionHours: fastestHours,
    slowestConversionDays: slowestDays,
    distribution: [
      {
        range: '< 24 Hours',
        count: counts.under24h,
        percentage: total > 0 ? Math.round((counts.under24h / total) * 100) : 0,
      },
      {
        range: '1–7 Days',
        count: counts.oneToSeven,
        percentage: total > 0 ? Math.round((counts.oneToSeven / total) * 100) : 0,
      },
      {
        range: '8–30 Days',
        count: counts.eightToThirty,
        percentage: total > 0 ? Math.round((counts.eightToThirty / total) * 100) : 0,
      },
      {
        range: '30+ Days',
        count: counts.overThirty,
        percentage: total > 0 ? Math.round((counts.overThirty / total) * 100) : 0,
      },
    ],
  };
}
