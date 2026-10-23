import { describe, it, expect } from 'vitest';
import { validateEnquiryTransition } from '@/lib/enquiryStateGuard';

describe('Enquiry Status Pipeline Stage Guard (enquiryStateGuard)', () => {
  it('allows natural sequential transitions', () => {
    const res = validateEnquiryTransition({
      fromStatus: 'new',
      toStatus: 'contacted',
    });
    expect(res.allowed).toBe(true);
  });

  it('requires a reason when transitioning to "lost"', () => {
    const withoutReason = validateEnquiryTransition({
      fromStatus: 'quote_sent',
      toStatus: 'lost',
      hasReason: false,
    });
    expect(withoutReason.allowed).toBe(false);
    expect(withoutReason.message).toContain('reason is required');

    const withReason = validateEnquiryTransition({
      fromStatus: 'quote_sent',
      toStatus: 'lost',
      hasReason: true,
    });
    expect(withReason.allowed).toBe(true);
  });

  it('guards against direct "new" to "won" transition without contact/quote', () => {
    const res = validateEnquiryTransition({
      fromStatus: 'new',
      toStatus: 'won',
    });
    expect(res.allowed).toBe(false);
    expect(res.message).toContain('must be qualified and contacted');
  });

  it('prevents modifying a won enquiry unless admin override is provided', () => {
    const res = validateEnquiryTransition({
      fromStatus: 'won',
      toStatus: 'negotiation',
    });
    expect(res.allowed).toBe(false);

    const adminRes = validateEnquiryTransition({
      fromStatus: 'won',
      toStatus: 'negotiation',
      isAdminOverride: true,
    });
    expect(adminRes.allowed).toBe(true);
  });
});
