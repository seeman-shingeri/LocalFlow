import { describe, it, expect, beforeEach } from 'vitest';
import { dashboardCache } from '@/lib/dashboardCache';
import { analyticsService } from '@/services/analyticsService';

describe('Enterprise Smart Dashboard Caching (dashboardCache)', () => {
  beforeEach(() => {
    dashboardCache.clear();
  });

  it('stores and retrieves fresh metrics within TTL window', () => {
    const mockMetrics = { totalCustomers: 42, revenue: 150000 };
    dashboardCache.set('ws-alpha', 30, mockMetrics);

    const lookup = dashboardCache.get('ws-alpha', 30, { ttlMs: 1000 });
    expect(lookup.status).toBe('fresh');
    expect(lookup.data).toEqual(mockMetrics);
  });

  it('marks data as stale when exceeding TTL but within maxAge window', () => {
    const mockMetrics = { totalCustomers: 50 };
    dashboardCache.set('ws-beta', 30, mockMetrics);

    // Simulated ttlMs: 0 means immediately stale, but maxAgeMs: 5000 means still accepted as stale
    const lookup = dashboardCache.get('ws-beta', 30, { ttlMs: -1, maxAgeMs: 5000 });
    expect(lookup.status).toBe('stale');
    expect(lookup.data).toEqual(mockMetrics);
  });

  it('invalidates cache cleanly per workspace', () => {
    dashboardCache.set('ws-1', 30, { val: 1 });
    dashboardCache.set('ws-2', 30, { val: 2 });

    expect(dashboardCache.size()).toBe(2);

    dashboardCache.invalidateWorkspace('ws-1');

    expect(dashboardCache.get('ws-1', 30).status).toBe('miss');
    expect(dashboardCache.get('ws-2', 30).status).toBe('fresh');
    expect(dashboardCache.size()).toBe(1);
  });

  it('serves cached metrics on second call in analyticsService', async () => {
    const wsId = 'test-ws-cache';
    const first = await analyticsService.getDashboardMetrics(wsId, 30);
    const second = await analyticsService.getDashboardMetrics(wsId, 30);

    expect(first).toEqual(second);

    // Forcing refresh bypasses cache
    const forced = await analyticsService.getDashboardMetrics(wsId, 30, { forceRefresh: true });
    expect(forced).toBeDefined();
  });
});
