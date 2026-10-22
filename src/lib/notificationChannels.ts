import { Customer } from '@/types/database';

export type CommunicationChannelType = 'email' | 'sms' | 'whatsapp' | 'call';

export interface ChannelEligibility {
  channel: CommunicationChannelType;
  label: string;
  available: boolean;
  preferred: boolean;
  contactValue: string;
}

/**
 * Evaluates a customer profile to determine available and preferred communication channels.
 */
export function getEligibleNotificationChannels(
  customer: Partial<Customer>
): ChannelEligibility[] {
  const email = customer.email?.trim() || '';
  const phone = customer.phone?.replace(/[^\d]/g, '') || '';
  const notesLower = (customer.notes || '').toLowerCase();

  const prefersWhatsApp = notesLower.includes('whatsapp') || notesLower.includes('wa only');
  const prefersEmail = notesLower.includes('email only') || notesLower.includes('prefer email');
  const prefersCall = notesLower.includes('call only') || notesLower.includes('prefer phone');

  return [
    {
      channel: 'whatsapp',
      label: 'WhatsApp',
      available: phone.length >= 7,
      preferred: prefersWhatsApp || (phone.length >= 7 && !prefersEmail && !prefersCall),
      contactValue: customer.phone || '',
    },
    {
      channel: 'email',
      label: 'Email',
      available: email.includes('@') && email.includes('.'),
      preferred: prefersEmail,
      contactValue: email,
    },
    {
      channel: 'sms',
      label: 'SMS Text',
      available: phone.length >= 7,
      preferred: false,
      contactValue: customer.phone || '',
    },
    {
      channel: 'call',
      label: 'Phone Call',
      available: phone.length >= 7,
      preferred: prefersCall,
      contactValue: customer.phone || '',
    },
  ];
}

/**
 * Selects the optimal dispatch channel based on customer data and message intent.
 */
export function selectBestNotificationChannel(
  customer: Partial<Customer>,
  intent: 'urgent' | 'document' | 'general' = 'general'
): CommunicationChannelType | null {
  const channels = getEligibleNotificationChannels(customer);
  const available = channels.filter((c) => c.available);

  if (available.length === 0) return null;

  // Documents (invoices, proposals) strongly prefer email if available
  if (intent === 'document') {
    const emailChannel = available.find((c) => c.channel === 'email');
    if (emailChannel) return 'email';
  }

  // Urgent alerts prefer direct call or WhatsApp
  if (intent === 'urgent') {
    const callChannel = available.find((c) => c.channel === 'call');
    if (callChannel && callChannel.preferred) return 'call';
    const waChannel = available.find((c) => c.channel === 'whatsapp');
    if (waChannel) return 'whatsapp';
  }

  // General: Pick first preferred channel or fallback to first available
  const preferred = available.find((c) => c.preferred);
  return preferred ? preferred.channel : available[0].channel;
}
