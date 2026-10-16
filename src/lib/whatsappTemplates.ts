import { Appointment, Customer } from '@/types/database';
import { format, parseISO } from 'date-fns';

/**
 * Strips non-numeric characters from a phone number string for wa.me links.
 */
export function cleanPhoneNumberForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

/**
 * Builds a direct WhatsApp web/app link with a pre-filled encoded message.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string
): string {
  const cleanPhone = cleanPhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(message);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Generates an event rental booking confirmation message ready for WhatsApp.
 */
export function generateBookingWhatsAppMessage(
  appointment: Appointment,
  customer?: Customer | null,
  businessName: string = 'LocalFlow Rentals'
): string {
  const clientName = customer?.name || appointment.customer?.name || 'Valued Client';
  let formattedDate = 'Scheduled Date';
  let formattedTime = 'Scheduled Time';

  try {
    const start = parseISO(appointment.start_time);
    const end = parseISO(appointment.end_time);
    formattedDate = format(start, 'EEEE, MMMM d, yyyy');
    formattedTime = `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  } catch {
    // fallback if date parsing fails
  }

  const lines = [
    `🎪 *Event Booking Confirmation — ${businessName}*`,
    ``,
    `Hello ${clientName},`,
    `We are delighted to confirm your event rental booking:`,
    ``,
    `📌 *Event:* ${appointment.title}`,
    `📅 *Date:* ${formattedDate}`,
    `⏰ *Time:* ${formattedTime}`,
  ];

  if (appointment.location) {
    lines.push(`📍 *Venue / Setup Location:* ${appointment.location}`);
  }

  if (appointment.notes) {
    lines.push(`📝 *Equipment Notes:* ${appointment.notes}`);
  }

  lines.push(
    ``,
    `Our logistics team will arrive prior to the scheduled window for setup and inspection.`,
    `Please reply to this message if you have any questions or schedule adjustments.`,
    ``,
    `Warm regards,`,
    `*${businessName}*`
  );

  return lines.join('\n');
}
