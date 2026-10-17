import { describe, it, expect } from 'vitest';
import {
  computeCustomerMatchScore,
  findPotentialCustomerDuplicates,
} from '@/lib/duplicateCustomerDetector';
import { Customer } from '@/types/database';

describe('Customer Duplicate Match Scoring (duplicateCustomerDetector)', () => {
  const existingCustomers: Customer[] = [
    {
      id: 'cust-1',
      workspace_id: 'ws-1',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@gmail.com',
      phone: '+1 (512) 555-0144',
      address: null,
      notes: null,
      source: 'Website',
      status: 'active',
      last_contact_date: null,
      next_follow_up_date: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cust-2',
      workspace_id: 'ws-1',
      name: 'Austin Event Planners LLC',
      email: 'contact@austinevents.com',
      phone: '+1 512 555 8899',
      address: null,
      notes: null,
      source: 'Referral',
      status: 'active',
      last_contact_date: null,
      next_follow_up_date: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

  it('detects high duplicate score (>=90) for identical email and name', () => {
    const candidate = {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@gmail.com',
      phone: null,
    };
    const res = computeCustomerMatchScore(candidate, existingCustomers[0]);
    expect(res.score).toBe(100); // 60 + 40 = 100
    expect(res.reasons).toContain('Identical email address');
    expect(res.reasons).toContain('Exact full name match');
  });

  it('detects matching phone number even with different formatting', () => {
    const candidate = {
      name: 'S. Jenkins',
      email: 'sjenkins@company.com',
      phone: '512-555-0144', // digits match +1 (512) 555-0144
    };
    const res = computeCustomerMatchScore(candidate, existingCustomers[0]);
    expect(res.score).toBeGreaterThanOrEqual(50);
    expect(res.reasons).toContain('Matching telephone number');
  });

  it('finds duplicates exceeding threshold and ranks highest score first', () => {
    const matches = findPotentialCustomerDuplicates(
      {
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@gmail.com',
      },
      existingCustomers,
      50
    );

    expect(matches.length).toBe(1);
    expect(matches[0].customer.id).toBe('cust-1');
  });

  it('ignores self when candidate ID is provided', () => {
    const matches = findPotentialCustomerDuplicates(
      {
        id: 'cust-1',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@gmail.com',
      },
      existingCustomers,
      50
    );

    expect(matches.length).toBe(0);
  });
});
