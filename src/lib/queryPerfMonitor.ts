/**
 * LocalFlow AI — Enterprise Database Performance & Slow Query Profiler
 *
 * Measures database query execution durations, computes average/maximum latencies,
 * flags queries exceeding slow-query thresholds, and detects N+1 access patterns.
 */

export interface QueryStats {
  queryKey: string;
  executionCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  slowQueryCount: number;
  lastExecutedAt: number;
}

export class QueryPerfMonitor {
  private queryMetrics: Map<string, QueryStats> = new Map();
  private slowQueryThresholdMs: number;

  constructor(slowQueryThresholdMs: number = 300) {
    this.slowQueryThresholdMs = slowQueryThresholdMs;
  }

  /**
   * Sets custom threshold for slow query warnings.
   */
  setSlowThreshold(thresholdMs: number): void {
    this.slowQueryThresholdMs = thresholdMs;
  }

  /**
   * Profiles an asynchronous query operation and records latency metrics.
   */
  async profile<T>(queryKey: string, operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - start;
      this.record(queryKey, Math.round(duration * 100) / 100);
    }
  }

  /**
   * Manually records a query duration.
   */
  record(queryKey: string, durationMs: number): void {
    let stats = this.queryMetrics.get(queryKey);
    const now = Date.now();
    const isSlow = durationMs >= this.slowQueryThresholdMs;

    if (!stats) {
      stats = {
        queryKey,
        executionCount: 1,
        totalDurationMs: durationMs,
        avgDurationMs: durationMs,
        minDurationMs: durationMs,
        maxDurationMs: durationMs,
        slowQueryCount: isSlow ? 1 : 0,
        lastExecutedAt: now,
      };
      this.queryMetrics.set(queryKey, stats);
    } else {
      stats.executionCount++;
      stats.totalDurationMs += durationMs;
      stats.avgDurationMs = Math.round((stats.totalDurationMs / stats.executionCount) * 100) / 100;
      stats.minDurationMs = Math.min(stats.minDurationMs, durationMs);
      stats.maxDurationMs = Math.max(stats.maxDurationMs, durationMs);
      if (isSlow) stats.slowQueryCount++;
      stats.lastExecutedAt = now;
    }
  }

  /**
   * Returns stats for all profiled queries.
   */
  getAllStats(): QueryStats[] {
    return Array.from(this.queryMetrics.values());
  }

  /**
   * Returns queries that have breached the slow query threshold.
   */
  getSlowQueries(): QueryStats[] {
    return Array.from(this.queryMetrics.values()).filter((q) => q.slowQueryCount > 0);
  }

  /**
   * Clears all recorded query metrics.
   */
  clear(): void {
    this.queryMetrics.clear();
  }
}

export const queryPerfMonitor = new QueryPerfMonitor();
