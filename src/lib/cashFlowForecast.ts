import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';

export interface ExpectedInflow {
  id: string;
  dueDate: string | Date;
  amount: number;
  confidenceScore?: number; // 0.0 to 1.0 (e.g. 0.9 for recurring client, 0.5 for overdue)
}

export interface ExpectedOutflow {
  id: string;
  dueDate: string | Date;
  amount: number;
  category?: string;
}

export interface DailyCashFlowSummary {
  date: string; // YYYY-MM-DD
  dayOffset: number;
  expectedInflow: number;
  expectedOutflow: number;
  netFlow: number;
  projectedClosingBalance: number;
}

export interface CashFlowForecastResult {
  horizonDays: number;
  startingBalance: number;
  totalProjectedInflow: number;
  totalProjectedOutflow: number;
  projectedNetChange: number;
  finalProjectedBalance: number;
  minimumProjectedBalance: number;
  cashReserveAlert: boolean;
  dailyTimeline: DailyCashFlowSummary[];
}

/**
 * Projects daily cash flow and running account balance over a specified forecast horizon.
 */
export function projectCashFlow(
  startingBalance: number,
  inflows: ExpectedInflow[],
  outflows: ExpectedOutflow[],
  horizonDays: number = 30,
  minOperatingReserve: number = 25000,
  referenceDate: Date = new Date()
): CashFlowForecastResult {
  const dailyTimeline: DailyCashFlowSummary[] = [];
  let runningBalance = startingBalance;
  let totalInflow = 0;
  let totalOutflow = 0;
  let minBalance = startingBalance;

  for (let offset = 0; offset <= horizonDays; offset++) {
    const targetDate = addDays(referenceDate, offset);
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    // Aggregate inflows due on this specific date
    let dayInflow = 0;
    for (const item of inflows) {
      const d = typeof item.dueDate === 'string' ? parseISO(item.dueDate) : item.dueDate;
      if (differenceInCalendarDays(d, referenceDate) === offset) {
        const factor = item.confidenceScore !== undefined ? item.confidenceScore : 1.0;
        dayInflow += Math.max(0, item.amount * factor);
      }
    }

    // Aggregate outflows due on this specific date
    let dayOutflow = 0;
    for (const item of outflows) {
      const d = typeof item.dueDate === 'string' ? parseISO(item.dueDate) : item.dueDate;
      if (differenceInCalendarDays(d, referenceDate) === offset) {
        dayOutflow += Math.max(0, item.amount);
      }
    }

    const netFlow = dayInflow - dayOutflow;
    runningBalance += netFlow;
    totalInflow += dayInflow;
    totalOutflow += dayOutflow;

    if (runningBalance < minBalance) {
      minBalance = runningBalance;
    }

    dailyTimeline.push({
      date: dateStr,
      dayOffset: offset,
      expectedInflow: Math.round(dayInflow * 100) / 100,
      expectedOutflow: Math.round(dayOutflow * 100) / 100,
      netFlow: Math.round(netFlow * 100) / 100,
      projectedClosingBalance: Math.round(runningBalance * 100) / 100,
    });
  }

  return {
    horizonDays,
    startingBalance,
    totalProjectedInflow: Math.round(totalInflow * 100) / 100,
    totalProjectedOutflow: Math.round(totalOutflow * 100) / 100,
    projectedNetChange: Math.round((totalInflow - totalOutflow) * 100) / 100,
    finalProjectedBalance: Math.round(runningBalance * 100) / 100,
    minimumProjectedBalance: Math.round(minBalance * 100) / 100,
    cashReserveAlert: minBalance < minOperatingReserve,
    dailyTimeline,
  };
}
