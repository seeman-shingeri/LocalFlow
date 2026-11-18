import { describe, it, expect } from 'vitest';
import {
  maskEmail,
  maskPhone,
  maskCreditCard,
  maskSecret,
  sanitizeObjectPII,
} from '@/lib/piiMasker';

describe('Enterprise Sensitive Data Protection & PII Masker (piiMasker)', () => {
  it('masks email addresses preserving domain and initial prefix', () => {
    expect(maskEmail('priya.sharma@example.com')).toBe('pr***@example.com');
    expect(maskEmail('a@b.com')).toBe('a***@b.com');
    expect(maskEmail('not-an-email')).toBe('[REDACTED_EMAIL]');
  });

  it('masks phone numbers preserving country prefix and last 4 digits', () => {
    expect(maskPhone('+919876543210')).toBe('+91 **** ***3210');
    expect(maskPhone('123')).toBe('[REDACTED_PHONE]');
  });

  it('masks payment card numbers preserving only the final 4 digits', () => {
    expect(maskCreditCard('4111 2222 3333 4444')).toBe('**** **** **** 4444');
    expect(maskCreditCard('1234')).toBe('[REDACTED_CARD]');
  });

  it('masks tokens and API keys', () => {
    expect(maskSecret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe('eyJh...[REDACTED]');
    expect(maskSecret('short')).toBe('[REDACTED]');
  });

  it('recursively sanitizes nested objects and redacts passwords and secrets', () => {
    const rawPayload = {
      user: {
        name: 'Rahul V',
        email: 'rahul@localflow.in',
        password: 'SuperSecretPassword123!',
        credentials: {
          accessToken: 'jwt-token-abcdef123456',
        },
      },
      customerPhone: '+919988776655',
      regularField: 'safe data',
    };

    const sanitized = sanitizeObjectPII(rawPayload);

    expect(sanitized.user.password).toBe('[REDACTED]');
    expect(sanitized.user.credentials.accessToken).toBe('[REDACTED]');
    expect(sanitized.user.email).toBe('ra***@localflow.in');
    expect(sanitized.customerPhone).toBe('+91 **** ***6655');
    expect(sanitized.regularField).toBe('safe data');
  });
});
