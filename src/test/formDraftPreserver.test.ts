import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormDraftPreserver } from '@/lib/formDraftPreserver';

describe('Enterprise Form Draft Preserver (formDraftPreserver)', () => {
  let preserver: FormDraftPreserver;

  beforeEach(() => {
    sessionStorage.clear();
    preserver = new FormDraftPreserver();
  });

  it('saves and restores form state cleanly', () => {
    const formData = {
      customerName: 'Aarav Patel',
      items: [{ description: 'Shamiyana Setup', quantity: 2, price: 15000 }],
    };

    const saved = preserver.saveDraft('invoice_new', formData);
    expect(saved).toBe(true);
    expect(preserver.hasDraft('invoice_new')).toBe(true);

    const loaded = preserver.loadDraft<typeof formData>('invoice_new');
    expect(loaded).toEqual(formData);
  });

  it('discards drafts that exceed maximum allowed age', () => {
    vi.useFakeTimers();
    const data = { notes: 'Tent requirements' };
    preserver.saveDraft('enquiry_form', data);

    // Advance 25 hours (max age is 24 hours)
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    const loaded = preserver.loadDraft('enquiry_form');
    expect(loaded).toBeNull();
    expect(preserver.hasDraft('enquiry_form')).toBe(false);
    vi.useRealTimers();
  });

  it('clears draft after successful submission', () => {
    preserver.saveDraft('customer_profile', { name: 'VIP' });
    expect(preserver.hasDraft('customer_profile')).toBe(true);

    preserver.clearDraft('customer_profile');
    expect(preserver.hasDraft('customer_profile')).toBe(false);
    expect(preserver.loadDraft('customer_profile')).toBeNull();
  });

  it('safely handles non-existent or corrupted draft keys', () => {
    expect(preserver.loadDraft('non_existent_key')).toBeNull();
    sessionStorage.setItem('localflow_draft_corrupt', 'not-valid-json');
    expect(preserver.loadDraft('corrupt')).toBeNull();
  });
});
