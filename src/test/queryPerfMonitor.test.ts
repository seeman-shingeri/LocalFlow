import { describe, it, expect, beforeEach } from 'vitest';
import { QueryPerfMonitor } from '@/lib/queryPerfMonitor';

describe('Enterprise Database Query Performance Monitor (queryPerfMonitor)', () => {
  let monitor: QueryPerfMonitor;

  beforeEach(() => {
    monitor = new QueryPerfMonitor(100); // 100ms slow threshold
  });

  it('records execution statistics and calculates average, min, and max latencies', () => {
    monitor.record('customers.getAll', 50);
    monitor.record('customers.getAll', 150);

    const stats = monitor.getAllStats();
    expect(stats).toHaveLength(1);
    expect(stats[0].executionCount).toBe(2);
    expect(stats[0].minDurationMs).toBe(50);
    expect(stats[0].maxDurationMs).toBe(150);
    expect(stats[0].avgDurationMs).toBe(100);
    expect(stats[0].slowQueryCount).toBe(1); // 150ms >= 100ms threshold
  });

  it('filters and identifies slow queries exceeding threshold', () => {
    monitor.record('fast.query', 20);
    monitor.record('slow.query', 250);

    const slow = monitor.getSlowQueries();
    expect(slow).toHaveLength(1);
    expect(slow[0].queryKey).toBe('slow.query');
  });

  it('profiles asynchronous operations seamlessly via profile() wrapper', async () => {
    const mockAsyncQuery = async () => {
      return [{ id: 1, name: 'Tents' }];
    };

    const data = await monitor.profile('inventory.list', mockAsyncQuery);
    expect(data).toHaveLength(1);

    const stats = monitor.getAllStats();
    expect(stats.some((s) => s.queryKey === 'inventory.list')).toBe(true);
  });
});
