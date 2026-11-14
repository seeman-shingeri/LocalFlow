import { describe, it, expect, beforeEach } from 'vitest';
import { apm } from '@/lib/apmMonitor';

describe('Enterprise Application Performance Monitoring (apmMonitor)', () => {
  beforeEach(() => {
    apm.clear();
  });

  it('measures async function execution duration and logs a span', async () => {
    const result = await apm.measure('fetch_dashboard_metrics', 'db', async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return { status: 'ok' };
    });

    expect(result).toEqual({ status: 'ok' });

    const spans = apm.getRecentSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('fetch_dashboard_metrics');
    expect(spans[0].category).toBe('db');
    expect(spans[0].durationMs).toBeGreaterThanOrEqual(25);
  });

  it('calculates metrics summary with P95 latency and category breakdowns', () => {
    // Manually push simulated spans
    for (let i = 1; i <= 20; i++) {
      const spanId = apm.startSpan(`query_${i}`, 'api');
      // End span immediately
      apm.endSpan(spanId);
    }

    const summary = apm.getSummary();
    expect(summary.totalSpansRecorded).toBe(20);
    expect(summary.categoryBreakdown.api.count).toBe(20);
    expect(summary.p95DurationMs).toBeGreaterThanOrEqual(0);
    expect(summary.averageDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('handles empty APM state without division by zero', () => {
    const summary = apm.getSummary();
    expect(summary.totalSpansRecorded).toBe(0);
    expect(summary.averageDurationMs).toBe(0);
    expect(summary.p95DurationMs).toBe(0);
  });
});
