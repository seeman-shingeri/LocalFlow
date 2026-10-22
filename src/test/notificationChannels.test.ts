import { describe, it, expect } from 'vitest';
import {
  getEligibleNotificationChannels,
  selectBestNotificationChannel,
} from '@/lib/notificationChannels';

describe('Client Notification Preference & Channel Dispatcher (notificationChannels)', () => {
  it('detects available channels based on phone and email presence', () => {
    const customer = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 512 555 1234',
      notes: null,
    };

    const channels = getEligibleNotificationChannels(customer);
    expect(channels.find((c) => c.channel === 'email')?.available).toBe(true);
    expect(channels.find((c) => c.channel === 'whatsapp')?.available).toBe(true);
    expect(channels.find((c) => c.channel === 'call')?.available).toBe(true);
  });

  it('identifies WhatsApp as preferred when explicitly noted or standard phone', () => {
    const customer = {
      name: 'Priya',
      phone: '+91 98765 43210',
      notes: 'Please communicate via WhatsApp only',
    };

    const channels = getEligibleNotificationChannels(customer);
    const wa = channels.find((c) => c.channel === 'whatsapp');
    expect(wa?.preferred).toBe(true);

    const best = selectBestNotificationChannel(customer, 'general');
    expect(best).toBe('whatsapp');
  });

  it('selects Email for document delivery (invoices/proposals) when email exists', () => {
    const customer = {
      name: 'Corporate Corp',
      email: 'billing@corporate.com',
      phone: '512-555-9000',
    };

    const best = selectBestNotificationChannel(customer, 'document');
    expect(best).toBe('email');
  });

  it('returns null when no communication channel is available', () => {
    const customer = {
      name: 'Anonymous Walk-in',
      email: null,
      phone: null,
    };

    const best = selectBestNotificationChannel(customer, 'general');
    expect(best).toBeNull();
  });
});
