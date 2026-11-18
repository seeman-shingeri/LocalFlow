/**
 * LocalFlow AI — Enterprise Timezone Consistency & IANA Date Converter
 *
 * Guarantees zero date-skew across event schedules, invoices, and follow-ups:
 * normalizes inputs to UTC ISO strings, formats timestamps in configured business timezones,
 * and accurately calculates business calendar day boundaries.
 */

export const DEFAULT_BUSINESS_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the IANA time zone of the browser runtime, falling back to business default.
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_BUSINESS_TIMEZONE;
  } catch {
    return DEFAULT_BUSINESS_TIMEZONE;
  }
}

/**
 * Formats a Date or ISO string into human-readable text for a specific IANA timezone.
 */
export function formatTimezone(
  date: Date | string,
  timezone: string = DEFAULT_BUSINESS_TIMEZONE,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-IN', {
    ...options,
    timeZone: timezone,
  }).format(d);
}

/**
 * Converts a localized date string (YYYY-MM-DD) and time string (HH:mm) into a UTC ISO string.
 */
export function toUtcIsoString(
  dateStr: string,
  timeStr: string = '00:00:00',
  timezone: string = DEFAULT_BUSINESS_TIMEZONE
): string {
  // Construct ISO-like representation
  const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
  const [hour = 0, minute = 0, second = 0] = timeStr.split(':').map((n) => parseInt(n, 10));

  // Determine timezone offset in minutes for the target timezone on that date
  const targetDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offsetMinutes = getTimezoneOffsetMinutes(timezone, targetDate);

  // Apply offset to convert to true UTC
  const utcMillis = targetDate.getTime() - offsetMinutes * 60 * 1000;
  return new Date(utcMillis).toISOString();
}

/**
 * Calculates the timezone offset in minutes for a given timezone and date.
 */
export function getTimezoneOffsetMinutes(
  timezone: string,
  date: Date = new Date()
): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (60 * 1000);
  } catch {
    return 330; // Asia/Kolkata +05:30 default
  }
}

/**
 * Checks whether two timestamps fall on the same calendar day in the target business timezone.
 */
export function isSameBusinessDay(
  dateA: Date | string,
  dateB: Date | string,
  timezone: string = DEFAULT_BUSINESS_TIMEZONE
): boolean {
  const dA = typeof dateA === 'string' ? new Date(dateA) : dateA;
  const dB = typeof dateB === 'string' ? new Date(dateB) : dateB;

  if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return false;

  const fmtA = formatTimezone(dA, timezone, { year: 'numeric', month: 'numeric', day: 'numeric' });
  const fmtB = formatTimezone(dB, timezone, { year: 'numeric', month: 'numeric', day: 'numeric' });

  return fmtA === fmtB;
}

/**
 * Returns UTC start-of-day and end-of-day ISO strings for a given local date.
 */
export function getBusinessDayBounds(
  dateStr: string,
  timezone: string = DEFAULT_BUSINESS_TIMEZONE
): { startIso: string; endIso: string } {
  const startIso = toUtcIsoString(dateStr, '00:00:00', timezone);
  const endIso = toUtcIsoString(dateStr, '23:59:59', timezone);
  return { startIso, endIso };
}
