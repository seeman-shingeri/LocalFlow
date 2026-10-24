import { parseISO, format } from 'date-fns';

export interface CalendarEventPayload {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string | Date;
  endTime: string | Date;
  organizerName?: string;
  organizerEmail?: string;
  clientEmail?: string;
}

/**
 * Formats a Date object or ISO string to UTC iCalendar format: YYYYMMDDTHHMMSSZ
 */
function toICalTimestamp(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return format(d, "yyyyMMdd'T'HHmmss");
}

/**
 * Escapes characters per RFC 5545 specification.
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant iCalendar string for appointments.
 */
export function generateICalendarEvent(event: CalendarEventPayload): string {
  const dtStamp = toICalTimestamp(new Date());
  const dtStart = toICalTimestamp(event.startTime);
  const dtEnd = toICalTimestamp(event.endTime);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LocalFlow AI//Event Management SaaS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }

  if (event.organizerName && event.organizerEmail) {
    lines.push(
      `ORGANIZER;CN=${escapeICalText(event.organizerName)}:mailto:${event.organizerEmail}`
    );
  }

  if (event.clientEmail) {
    lines.push(`ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT:mailto:${event.clientEmail}`);
  }

  // Add 1-hour alarm notification
  lines.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder for scheduled event setup',
    'TRIGGER:-PT60M',
    'END:VALARM'
  );

  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}
