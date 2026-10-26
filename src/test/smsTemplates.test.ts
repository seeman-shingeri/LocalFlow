import { describe, it, expect } from 'vitest';
import { formatSmsTemplate } from '@/lib/smsTemplates';

describe('Quick SMS Message Template Formatter (smsTemplates)', () => {
  it('formats a booking confirmation SMS with variables', () => {
    const res = formatSmsTemplate('booking_confirmation', {
      clientName: 'Sanjay',
      businessName: 'Royal Shamiyana Rentals',
      eventDate: '15 Nov 2026',
      contactPhone: '+919876543210',
    });

    expect(res.body).toContain('Hi Sanjay');
    expect(res.body).toContain('15 Nov 2026 is confirmed with Royal Shamiyana Rentals');
    expect(res.body).toContain('+919876543210');
    expect(res.segmentCount).toBe(1);
    expect(res.charCount).toBeLessThanOrEqual(160);
  });

  it('formats payment reminder with pending amount and invoice number', () => {
    const res = formatSmsTemplate('payment_reminder', {
      clientName: 'Sunita Rao',
      businessName: 'LocalFlow',
      amountPending: 35000,
      invoiceNumber: 'INV-108',
    });

    expect(res.body).toContain('pending balance ₹35,000 for invoice #INV-108');
  });

  it('formats setup arrival ETA notice', () => {
    const res = formatSmsTemplate('setup_arrival', {
      clientName: 'Vikram',
      businessName: 'Star Event Trussing',
      crewEta: '30 mins (11:00 AM)',
      contactPhone: '+919988776655',
    });

    expect(res.body).toContain('Estimated arrival: 30 mins (11:00 AM)');
    expect(res.body).toContain('Driver contact: +919988776655');
  });
});
