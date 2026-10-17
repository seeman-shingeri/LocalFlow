import { describe, it, expect } from 'vitest';
import {
  calculateEnquiryScore,
  sortEnquiriesByUrgency,
} from '@/lib/enquiryScoring';
import { Enquiry } from '@/types/database';

describe('Enquiry Urgency Scoring Engine (enquiryScoring)', () => {
  const freshHotEnquiry: Enquiry = {
    id: 'enq-1',
    workspace_id: 'ws-1',
    customer_id: 'cust-1',
    title: 'Grand Wedding Marquee Tent & Staging Package',
    service_type: 'Full Event Setup',
    estimated_value: 6500,
    status: 'new',
    priority: 'high',
    notes: 'Urgent weekend booking inquiry',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const moderateEnquiry: Enquiry = {
    id: 'enq-2',
    workspace_id: 'ws-1',
    customer_id: 'cust-2',
    title: 'Banquet Chairs Rental',
    service_type: 'Furniture',
    estimated_value: 400,
    status: 'contacted',
    priority: 'low',
    notes: null,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const convertedEnquiry: Enquiry = {
    ...freshHotEnquiry,
    id: 'enq-3',
    status: 'converted',
  };

  it('assigns high score (>=75) and critical urgency to large, fresh, high-priority enquiries', () => {
    const res = calculateEnquiryScore(freshHotEnquiry);
    expect(res.score).toBeGreaterThanOrEqual(75);
    expect(res.urgencyLevel).toBe('critical');
    expect(res.recommendedAction).toContain('Call immediately');
  });

  it('assigns low score to low value, old, low-priority leads', () => {
    const res = calculateEnquiryScore(moderateEnquiry);
    expect(res.score).toBeLessThan(50);
  });

  it('assigns score of 0 to converted or closed deals', () => {
    const res = calculateEnquiryScore(convertedEnquiry);
    expect(res.score).toBe(0);
    expect(res.urgencyLevel).toBe('low');
    expect(res.recommendedAction).toBe('Deal won');
  });

  it('sorts list of enquiries by urgency score descending', () => {
    const sorted = sortEnquiriesByUrgency([moderateEnquiry, convertedEnquiry, freshHotEnquiry]);
    expect(sorted[0].id).toBe('enq-1'); // highest score
    expect(sorted[sorted.length - 1].id).toBe('enq-3'); // converted = 0 score
  });
});
