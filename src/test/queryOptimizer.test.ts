import { describe, it, expect, beforeEach } from 'vitest';
import {
  coalesceQuery,
  chunkIds,
  buildProjection,
  getQueryOptimizationStats,
  resetQueryOptimizationStats,
} from '@/lib/queryOptimizer';

describe('Enterprise Database Query Optimization (queryOptimizer)', () => {
  beforeEach(() => {
    resetQueryOptimizationStats();
  });

  it('coalesces multiple concurrent identical queries into a single database fetch', async () => {
    let executionCount = 0;
    const mockFetcher = async () => {
      executionCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return [{ id: '1', name: 'Tent Deluxe' }];
    };

    // Simulate 3 components mounting at the exact same moment requesting the same query
    const [res1, res2, res3] = await Promise.all([
      coalesceQuery('inventory:all', mockFetcher),
      coalesceQuery('inventory:all', mockFetcher),
      coalesceQuery('inventory:all', mockFetcher),
    ]);

    expect(executionCount).toBe(1);
    expect(res1).toEqual(res2);
    expect(res2).toEqual(res3);

    const stats = getQueryOptimizationStats();
    expect(stats.totalExecutedQueries).toBe(1);
    expect(stats.inFlightDeduplications).toBe(2);
  });

  it('chunks large ID sets into manageable batches to prevent query overflow', () => {
    const ids = Array.from({ length: 125 }, (_, i) => `id-${i + 1}`);
    const batches = chunkIds(ids, 50);

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(50);
    expect(batches[1]).toHaveLength(50);
    expect(batches[2]).toHaveLength(25);
  });

  it('builds targeted projection strings and falls back to wildcard for empty lists', () => {
    expect(buildProjection(['id', 'name', 'phone'])).toBe('id, name, phone');
    expect(buildProjection([])).toBe('*');
  });
});
