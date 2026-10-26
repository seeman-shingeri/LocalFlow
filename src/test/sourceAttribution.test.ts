import { describe, it, expect } from 'vitest';
import { aggregateSourceAttribution, LeadAcquisitionRecord } from '@/lib/sourceAttribution';

describe('Lead Source Attribution ROI & Conversion Rate Aggregator (sourceAttribution)', () => {
  it('accurately computes conversion rates and revenue per marketing source', () => {
    const leads: LeadAcquisitionRecord[] = [
      { id: '1', source: 'Google Ads', status: 'won', revenueGenerated: 50000 },
      { id: '2', source: 'Google Ads', status: 'lost' },
      { id: '3', source: 'Google Ads', status: 'won', revenueGenerated: 30000 },
      { id: '4', source: 'Instagram', status: 'won', revenueGenerated: 25000 },
      { id: '5', source: 'Instagram', status: 'lost' },
      { id: '6', source: 'Referral', status: 'won', revenueGenerated: 120000 },
    ];

    const result = aggregateSourceAttribution(leads);

    expect(result.totalLeads).toBe(6);
    expect(result.totalConverted).toBe(4);
    expect(result.totalRevenue).toBe(225000);
    // Overall conversion rate = (4 / 6) * 100 = 66.7%
    expect(result.overallConversionRate).toBe(66.7);

    // Referral generated highest revenue
    expect(result.topSourceByRevenue).toBe('referral');

    // Google ads conversion: 2/3 = 66.7%
    const googleMetrics = result.sources.find((s) => s.source === 'google ads');
    expect(googleMetrics).toBeDefined();
    expect(googleMetrics?.totalLeads).toBe(3);
    expect(googleMetrics?.convertedLeads).toBe(2);
    expect(googleMetrics?.conversionRate).toBe(66.7);
    expect(googleMetrics?.totalRevenue).toBe(80000);
    expect(googleMetrics?.averageDealValue).toBe(40000);
  });

  it('handles empty datasets cleanly', () => {
    const emptyResult = aggregateSourceAttribution([]);
    expect(emptyResult.totalLeads).toBe(0);
    expect(emptyResult.totalConverted).toBe(0);
    expect(emptyResult.totalRevenue).toBe(0);
    expect(emptyResult.sources).toEqual([]);
    expect(emptyResult.topSourceByRevenue).toBeNull();
  });
});
