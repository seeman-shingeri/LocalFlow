/**
 * Enterprise Smart Dashboard Caching
 * Implements Stale-While-Revalidate (SWR) caching with configurable TTL and proactive invalidation.
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number; // Date.now()
  workspaceId: string;
}

export interface CacheLookupResult<T> {
  data: T | null;
  status: 'fresh' | 'stale' | 'miss';
}

export interface DashboardCacheOptions {
  ttlMs?: number; // Time in ms before entry becomes stale (default: 60,000ms = 1 min)
  maxAgeMs?: number; // Max time in ms to accept stale data while revalidating (default: 300,000ms = 5 min)
}

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_AGE_MS = 300_000;

class DashboardCacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  private buildKey(workspaceId: string, periodDays: number): string {
    return `dashboard:${workspaceId}:period:${periodDays}`;
  }

  /**
   * Retrieves cached dashboard metrics using stale-while-revalidate semantics.
   */
  get<T>(
    workspaceId: string,
    periodDays: number,
    options: DashboardCacheOptions = {}
  ): CacheLookupResult<T> {
    const key = this.buildKey(workspaceId, periodDays);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return { data: null, status: 'miss' };
    }

    const age = Date.now() - entry.timestamp;
    const ttl = options.ttlMs ?? DEFAULT_TTL_MS;
    const maxAge = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;

    if (age <= ttl) {
      return { data: entry.data, status: 'fresh' };
    }

    if (age <= maxAge) {
      return { data: entry.data, status: 'stale' };
    }

    // Expired past maxAge
    this.cache.delete(key);
    return { data: null, status: 'miss' };
  }

  /**
   * Stores fresh dashboard metrics in cache.
   */
  set<T>(workspaceId: string, periodDays: number, data: T): void {
    const key = this.buildKey(workspaceId, periodDays);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      workspaceId,
    });
  }

  /**
   * Invalidates cached metrics for a workspace (e.g. after customer/invoice mutations).
   */
  invalidateWorkspace(workspaceId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.workspaceId === workspaceId) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache (useful on logout or workspace switch).
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current count of cached workspace views.
   */
  size(): number {
    return this.cache.size;
  }
}

export const dashboardCache = new DashboardCacheManager();
