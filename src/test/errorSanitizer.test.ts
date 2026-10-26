import { describe, it, expect } from 'vitest';
import { sanitizeApplicationError } from '@/lib/errorSanitizer';

describe('Error Boundary Message Sanitizer & Safe Fallback Generator (errorSanitizer)', () => {
  it('translates network failures into friendly connection notices', () => {
    const error = new TypeError('Failed to fetch');
    const sanitized = sanitizeApplicationError(error);

    expect(sanitized.userFacingTitle).toBe('Connection Issue');
    expect(sanitized.userFacingMessage).toContain('verify your internet connection');
    expect(sanitized.isRecoverable).toBe(true);
    expect(sanitized.incidentId).toContain('ERR_');
  });

  it('translates permission and RLS rejections properly', () => {
    const error = new Error('new row violates row-level security policy for table customers');
    const sanitized = sanitizeApplicationError(error);

    expect(sanitized.userFacingTitle).toBe('Access Restricted');
    expect(sanitized.userFacingMessage).toContain('sufficient permissions');
    expect(sanitized.isRecoverable).toBe(false);
  });

  it('translates duplicate key constraint errors', () => {
    const error = new Error('duplicate key value violates unique constraint "customers_phone_key"');
    const sanitized = sanitizeApplicationError(error);

    expect(sanitized.userFacingTitle).toBe('Duplicate Entry');
    expect(sanitized.suggestedAction).toContain('Review your entered phone number');
  });

  it('redacts sensitive bearer tokens or keys from generic errors', () => {
    const error = new Error('Auth failed with Bearer eyJhbGciOi... and apikey=secret_key_123');
    const sanitized = sanitizeApplicationError(error);

    expect(sanitized.userFacingTitle).toBe('Session Expired');
  });
});
