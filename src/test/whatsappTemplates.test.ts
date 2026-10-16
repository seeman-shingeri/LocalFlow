import { describe, it, expect } from 'vitest';
import {
  cleanPhoneNumberForWhatsApp,
  buildWhatsAppUrl,
  generateBookingWhatsAppMessage,
} from '@/lib/whatsappTemplates';
import { Appointment, Customer } from '@/types/database';

describe('WhatsApp Event Booking Confirmation Templates', () => {
  const mockCustomer: Customer = {
    id: 'cust-101',
    workspace_id: 'ws-1',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+1 (512) 555-0199',
    address: '100 Sunset Blvd',
    notes: 'Wedding coordinator',
    source: 'Referral',
    status: 'active',
    last_contact_date: null,
    next_follow_up_date: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };

  const mockAppointment: Appointment = {
    id: 'apt-201',
    workspace_id: 'ws-1',
    customer_id: 'cust-101',
    title: 'Outdoor Wedding Canopy & Shamiyana Setup',
    start_time: '2026-10-24T10:00:00Z',
    end_time: '2026-10-24T14:00:00Z',
    duration_minutes: 240,
    status: 'scheduled',
    location: 'Hill Country Event Grounds, Austin, TX',
    notes: '40x60 marquee tent with 200 banquet chairs and fairy lighting',
    created_at: '2026-10-10T00:00:00Z',
    updated_at: '2026-10-10T00:00:00Z',
    customer: mockCustomer,
  };

  it('cleans phone numbers by stripping punctuation and spaces', () => {
    expect(cleanPhoneNumberForWhatsApp('+1 (512) 555-0199')).toBe('15125550199');
    expect(cleanPhoneNumberForWhatsApp('+91 98765-43210')).toBe('919876543210');
    expect(cleanPhoneNumberForWhatsApp(null)).toBe('');
    expect(cleanPhoneNumberForWhatsApp(undefined)).toBe('');
  });

  it('builds wa.me URL with clean phone number and encoded message', () => {
    const url = buildWhatsAppUrl('+1 (512) 555-0199', 'Hello Priya!');
    expect(url).toBe('https://wa.me/15125550199?text=Hello%20Priya!');
  });

  it('falls back to api.whatsapp.com when phone is not provided', () => {
    const url = buildWhatsAppUrl('', 'General broadcast');
    expect(url).toBe('https://api.whatsapp.com/send?text=General%20broadcast');
  });

  it('generates a personalized confirmation message with event details', () => {
    const message = generateBookingWhatsAppMessage(
      mockAppointment,
      mockCustomer,
      'Apex Shamiyana & Rentals'
    );

    expect(message).toContain('*Event Booking Confirmation — Apex Shamiyana & Rentals*');
    expect(message).toContain('Hello Priya Sharma,');
    expect(message).toContain('Outdoor Wedding Canopy & Shamiyana Setup');
    expect(message).toContain('Hill Country Event Grounds, Austin, TX');
    expect(message).toContain('40x60 marquee tent with 200 banquet chairs and fairy lighting');
    expect(message).toContain('*Apex Shamiyana & Rentals*');
  });

  it('handles appointment with missing customer gracefully', () => {
    const orphanApt: Appointment = {
      ...mockAppointment,
      customer: undefined,
    };
    const message = generateBookingWhatsAppMessage(orphanApt, null);
    expect(message).toContain('Hello Valued Client,');
  });
});
