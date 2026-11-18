import { describe, it, expect } from 'vitest';
import { redactInternalDetails, secureFormatError } from '@/lib/secureError';

describe('Enterprise Secure Error Responses & Stack Redaction (secureError)', () => {
  it('redacts raw PostgreSQL error messages and schema table references', () => {
    const rawPostgres = 'duplicate key value violates unique constraint "customers_email_key" at table "public.customers"';
    const redacted = redactInternalDetails(rawPostgres);
    expect(redacted).toBe('A record with this information already exists in the system.');
  });

  it('redacts filesystem directory paths from errors', () => {
    const rawError = 'Error reading file C:\\Users\\CITYcomp\\Desktop\\LocalFlow\\src\\secret.key: file not found';
    const redacted = redactInternalDetails(rawError);
    expect(redacted).not.toContain('C:\\Users');
    expect(redacted).toContain('[internal-path]');
  });

  it('formats network disconnection errors into clean client response with incident ID', () => {
    const response = secureFormatError(new Error('TypeError: Failed to fetch (network offline)'));
    expect(response.code).toBe('NETWORK_UNAVAILABLE');
    expect(response.message).toContain('Network connection interrupted');
    expect(response.incidentId).toMatch(/^INC-/);
  });

  it('formats unauthorized and forbidden errors safely', () => {
    const unauth = secureFormatError(new Error('Invalid credentials or expired JWT'));
    expect(unauth.code).toBe('UNAUTHORIZED');

    const forbidden = secureFormatError(new Error('Permission denied by RLS policy'));
    expect(forbidden.code).toBe('FORBIDDEN');
  });

  it('formats rate limited errors accurately', () => {
    const rateLimited = secureFormatError(new Error('Too many requests, rate limit exceeded'));
    expect(rateLimited.code).toBe('RATE_LIMITED');
    expect(rateLimited.message).toContain('Too many requests');
  });
});
