export type SmsTemplateType =
  | 'booking_confirmation'
  | 'payment_reminder'
  | 'setup_arrival'
  | 'feedback_request';

export interface SmsTemplateVariables {
  clientName: string;
  businessName: string;
  eventDate?: string;
  invoiceNumber?: string;
  amountPending?: number;
  crewEta?: string;
  contactPhone?: string;
  reviewLink?: string;
}

export interface FormattedSmsMessage {
  type: SmsTemplateType;
  body: string;
  charCount: number;
  segmentCount: number; // 1 segment <= 160 chars, 2 segments <= 306, etc.
}

/**
 * Calculates SMS segment count based on standard GSM-7 message length limits.
 */
function calculateSmsSegments(text: string): number {
  const len = text.length;
  if (len === 0) return 0;
  if (len <= 160) return 1;
  // Multi-part SMS allows 153 chars per segment due to concatenation header
  return Math.ceil(len / 153);
}

/**
 * Generates tailored SMS/WhatsApp messages for event clients with segment metrics.
 */
export function formatSmsTemplate(
  type: SmsTemplateType,
  vars: SmsTemplateVariables
): FormattedSmsMessage {
  const name = vars.clientName || 'Customer';
  const biz = vars.businessName || 'LocalFlow Events';

  let body = '';

  switch (type) {
    case 'booking_confirmation':
      body = `Hi ${name}, your event booking for ${vars.eventDate || 'your upcoming date'} is confirmed with ${biz}. We look forward to setting up your event! Contact: ${vars.contactPhone || 'us'}`;
      break;

    case 'payment_reminder':
      body = `Dear ${name}, this is a gentle reminder from ${biz} regarding pending balance ₹${(vars.amountPending || 0).toLocaleString()} for invoice #${vars.invoiceNumber || 'due'}. Please settle via UPI/bank transfer. Thank you!`;
      break;

    case 'setup_arrival':
      body = `Hello ${name}, our rigging and setup crew from ${biz} is en route to your venue. Estimated arrival: ${vars.crewEta || 'within 1 hour'}. Driver contact: ${vars.contactPhone || 'our office'}.`;
      break;

    case 'feedback_request':
      body = `Hi ${name}, thank you for choosing ${biz}! How was your event experience? We'd love your feedback: ${vars.reviewLink || 'https://localflow.ai/review'}`;
      break;
  }

  const charCount = body.length;
  const segmentCount = calculateSmsSegments(body);

  return {
    type,
    body,
    charCount,
    segmentCount,
  };
}
