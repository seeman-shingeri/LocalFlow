import { describe, it, expect } from 'vitest';
import { evaluateCustomerRecency } from '@/lib/customerRecency';
import { subDays } from 'date-fns';

describe('Customer Engagement Recency Score & Inactivity Alert (customerRecency)', () => {
  const refDate = new Date(2026, 9, 20);

  it('marks customers contacted recently as active with low churn risk', () => {
    const lastDate = subDays(refDate, 12);
    const res = evaluateCustomerRecency('cust-1', lastDate, 5, refDate);

    expect(res.status).toBe('active');
    expect(res.churnRiskPercentage).toBe(10);
    expect(res.needsAttention).toBe(false);
  });

  it('flags clients inactive between 30 and 90 days as cooling down', () => {
    const lastDate = subDays(refDate, 45);
    const res = evaluateCustomerRecency('cust-2', lastDate, 2, refDate);

    expect(res.status).toBe('cooling_down');
    expect(res.churnRiskPercentage).toBe(30);
  });

  it('triggers an at-risk alert for clients silent over 180 days with re-engagement recommendation', () => {
    const lastDate = subDays(refDate, 210);
    const res = evaluateCustomerRecency('cust-3', lastDate, 1, refDate);

    expect(res.status).toBe('at_risk');
    expect(res.needsAttention).toBe(true);
    expect(res.churnRiskPercentage).toBe(90);
    expect(res.recommendedAction).toContain('dormant over 6 months');
  });

  it('handles empty interaction dates safely', () => {
    const res = evaluateCustomerRecency('cust-new', null, 0, refDate);
    expect(res.status).toBe('at_risk');
    expect(res.needsAttention).toBe(true);
  });
});
