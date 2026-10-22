import { describe, it, expect } from 'vitest';
import { calculateConversionVelocity } from '@/lib/funnelVelocity';
import { Enquiry } from '@/types/database';
import { subDays, subHours } from 'date-fns';

describe('Enquiry Funnel Velocity Calculator (funnelVelocity)', () => {
  const now = new Date();

  const mockEnquiries: Enquiry[] = [
    // 1. Fast conversion (4 hours)
    {
      id: 'enq-1',
      workspace_id: 'ws-1',
      customer_id: 'cust-1',
      title: 'Fast Deal',
      service_type: 'Rental',
      estimated_value: 1200,
      status: 'converted',
      priority: 'high',
      notes: null,
      created_at: subHours(now, 4).toISOString(),
      updated_at: now.toISOString(),
    },
    // 2. 3 Days conversion
    {
      id: 'enq-2',
      workspace_id: 'ws-1',
      customer_id: 'cust-2',
      title: 'Mid Deal',
      service_type: 'Rental',
      estimated_value: 2000,
      status: 'converted',
      priority: 'medium',
      notes: null,
      created_at: subDays(now, 3).toISOString(),
      updated_at: now.toISOString(),
    },
    // 3. 10 Days conversion
    {
      id: 'enq-3',
      workspace_id: 'ws-1',
      customer_id: 'cust-3',
      title: 'Slow Deal',
      service_type: 'Rental',
      estimated_value: 5000,
      status: 'converted',
      priority: 'high',
      notes: null,
      created_at: subDays(now, 10).toISOString(),
      updated_at: now.toISOString(),
    },
    // 4. Non-converted lead (should be ignored)
    {
      id: 'enq-4',
      workspace_id: 'ws-1',
      customer_id: 'cust-4',
      title: 'Open Deal',
      service_type: 'Rental',
      estimated_value: 3000,
      status: 'interested',
      priority: 'high',
      notes: null,
      created_at: subDays(now, 2).toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  it('calculates average, median, fastest, and bucketed velocity', () => {
    const res = calculateConversionVelocity(mockEnquiries);

    expect(res.totalConverted).toBe(3);
    expect(res.fastestConversionHours).toBe(4);
    expect(res.slowestConversionDays).toBe(10);
    expect(res.medianDaysToConversion).toBe(3);

    // Distribution
    const under24 = res.distribution.find((d) => d.range === '< 24 Hours');
    expect(under24?.count).toBe(1);

    const oneToSeven = res.distribution.find((d) => d.range === '1–7 Days');
    expect(oneToSeven?.count).toBe(1);

    const eightToThirty = res.distribution.find((d) => d.range === '8–30 Days');
    expect(eightToThirty?.count).toBe(1);
  });

  it('handles empty or zero converted leads without NaN', () => {
    const res = calculateConversionVelocity([]);
    expect(res.totalConverted).toBe(0);
    expect(res.averageDaysToConversion).toBe(0);
    expect(res.medianDaysToConversion).toBe(0);
  });
});
