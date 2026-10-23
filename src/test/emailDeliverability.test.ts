import { describe, it, expect } from 'vitest';
import { validateEmailDeliverability } from '@/lib/emailDeliverability';

describe('Customer Email Domain & Deliverability Validator (emailDeliverability)', () => {
  it('validates legitimate customer email addresses', () => {
    const res = validateEmailDeliverability('contact@eventpro.in');
    expect(res.isValidFormat).toBe(true);
    expect(res.isDisposable).toBe(false);
    expect(res.domain).toBe('eventpro.in');
    expect(res.localPart).toBe('contact');
    expect(res.suggestedCorrection).toBeUndefined();
    expect(res.warning).toBeUndefined();
  });

  it('detects common typos and suggests corrections (e.g. gnail.com -> gmail.com)', () => {
    const res = validateEmailDeliverability('rajesh.kumar@gnail.com');
    expect(res.isValidFormat).toBe(true);
    expect(res.suggestedCorrection).toBe('rajesh.kumar@gmail.com');
    expect(res.warning).toContain('Did you mean rajesh.kumar@gmail.com');
  });

  it('flags disposable temporary throwaway email domains', () => {
    const res = validateEmailDeliverability('tester123@mailinator.com');
    expect(res.isValidFormat).toBe(true);
    expect(res.isDisposable).toBe(true);
    expect(res.warning).toContain('temporary disposable email service');
  });

  it('rejects invalid email formats', () => {
    const res = validateEmailDeliverability('invalid-email-address');
    expect(res.isValidFormat).toBe(false);
    expect(res.warning).toBe('Invalid email format.');
  });
});
