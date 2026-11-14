/**
 * Enterprise Database Query Optimization Utilities
 * Provides in-flight query coalescing (deduplication), ID batching, and projection optimizations.
 */

// In-flight promise registry to deduplicate simultaneous identical database queries
const inFlightQueries = new Map<string, Promise<any>>();

export interface QueryOptimizationStats {
  inFlightDeduplications: number;
  totalExecutedQueries: number;
  slowQueriesCount: number;
}

const stats: QueryOptimizationStats = {
  inFlightDeduplications: 0,
  totalExecutedQueries: 0,
  slowQueriesCount: 0,
};

/**
 * Coalesces identical concurrent queries into a single in-flight promise.
 * Prevents multiple components mounting simultaneously from triggering duplicate DB queries.
 */
export async function coalesceQuery<T>(
  queryKey: string,
  fetcher: () => Promise<T>,
  options: { slowThresholdMs?: number } = {}
): Promise<T> {
  const existing = inFlightQueries.get(queryKey);
  if (existing) {
    stats.inFlightDeduplications += 1;
    return existing as Promise<T>;
  }

  const slowThreshold = options.slowThresholdMs ?? 500;
  const start = performance.now();

  const promise = (async () => {
    try {
      stats.totalExecutedQueries += 1;
      return await fetcher();
    } finally {
      const elapsed = performance.now() - start;
      if (elapsed > slowThreshold) {
        stats.slowQueriesCount += 1;
      }
      inFlightQueries.delete(queryKey);
    }
  })();

  inFlightQueries.set(queryKey, promise);
  return promise;
}

/**
 * Splits an array of IDs into optimal batch chunks to prevent Supabase/PostgreSQL URL/query length limits.
 */
export function chunkIds<T>(ids: T[], chunkSize: number = 50): T[][] {
  if (!ids || ids.length === 0) return [];
  const safeChunkSize = Math.max(1, chunkSize);
  const chunks: T[][] = [];
  for (let i = 0; i < ids.length; i += safeChunkSize) {
    chunks.push(ids.slice(i, i + safeChunkSize));
  }
  return chunks;
}

/**
 * Builds a selective column projection string from a list of required fields to avoid wasteful SELECT *.
 */
export function buildProjection<T extends string>(fields: T[]): string {
  if (!fields || fields.length === 0) return '*';
  const clean = fields.map((f) => f.trim()).filter(Boolean);
  return clean.length > 0 ? clean.join(', ') : '*';
}

/**
 * Returns diagnostic metrics about query optimization.
 */
export function getQueryOptimizationStats(): QueryOptimizationStats {
  return { ...stats };
}

/**
 * Resets query optimization metrics (useful for testing or session reset).
 */
export function resetQueryOptimizationStats(): void {
  stats.inFlightDeduplications = 0;
  stats.totalExecutedQueries = 0;
  stats.slowQueriesCount = 0;
  inFlightQueries.clear();
}
