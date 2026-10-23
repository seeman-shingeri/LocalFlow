import { describe, it, expect } from 'vitest';
import { projectCashFlow, ExpectedInflow, ExpectedOutflow } from '@/lib/cashFlowForecast';
import { addDays } from 'date-fns';

describe('Cash Flow Forecast Net Inflow / Outflow Projector (cashFlowForecast)', () => {
  const refDate = new Date(2026, 9, 20); // Oct 20, 2026

  it('correctly calculates net changes and ending balance over horizon', () => {
    const inflows: ExpectedInflow[] = [
      { id: 'inv-1', dueDate: addDays(refDate, 2), amount: 50000, confidenceScore: 1.0 },
      { id: 'inv-2', dueDate: addDays(refDate, 5), amount: 30000, confidenceScore: 0.8 }, // 24000 weighted
    ];

    const outflows: ExpectedOutflow[] = [
      { id: 'exp-1', dueDate: addDays(refDate, 3), amount: 15000, category: 'Vendor Payout' },
    ];

    const res = projectCashFlow(40000, inflows, outflows, 7, 20000, refDate);

    // Total inflow = 50000 + 24000 = 74000
    expect(res.totalProjectedInflow).toBe(74000);
    // Total outflow = 15000
    expect(res.totalProjectedOutflow).toBe(15000);
    // Net change = 74000 - 15000 = 59000
    expect(res.projectedNetChange).toBe(59000);
    // Final balance = 40000 + 59000 = 99000
    expect(res.finalProjectedBalance).toBe(99000);
    expect(res.cashReserveAlert).toBe(false);
  });

  it('triggers cashReserveAlert when balance dips below minimum operating threshold', () => {
    const inflows: ExpectedInflow[] = [];
    const outflows: ExpectedOutflow[] = [
      { id: 'exp-large', dueDate: addDays(refDate, 1), amount: 35000 },
    ];

    // Starting with 40000, dips to 5000 on day 1 (below reserve 10000)
    const res = projectCashFlow(40000, inflows, outflows, 3, 10000, refDate);
    expect(res.minimumProjectedBalance).toBe(5000);
    expect(res.cashReserveAlert).toBe(true);
  });
});
