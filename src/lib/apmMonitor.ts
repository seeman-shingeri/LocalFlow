/**
 * Enterprise Application Performance Monitoring (APM)
 * Tracks transaction spans, API latency, render durations, and calculates p95/p99 latency metrics.
 */

export type SpanCategory = 'api' | 'db' | 'render' | 'navigation' | 'ai' | 'computation';

export interface PerformanceSpan {
  id: string;
  name: string;
  category: SpanCategory;
  startTime: number;
  durationMs: number;
  isSlow: boolean;
  metadata?: Record<string, unknown>;
}

export interface ApmMetricsSummary {
  totalSpansRecorded: number;
  slowSpansCount: number;
  averageDurationMs: number;
  maxDurationMs: number;
  p95DurationMs: number;
  categoryBreakdown: Record<SpanCategory, { count: number; avgMs: number }>;
}

const DEFAULT_SLOW_THRESHOLDS: Record<SpanCategory, number> = {
  api: 800,
  db: 300,
  render: 50,
  navigation: 400,
  ai: 2000,
  computation: 100,
};

const MAX_SPANS_BUFFER = 200;

class PerformanceMonitor {
  private spans: PerformanceSpan[] = [];
  private activeSpans = new Map<string, { name: string; category: SpanCategory; start: number; metadata?: Record<string, unknown> }>();

  /**
   * Starts a timed performance span.
   */
  public startSpan(name: string, category: SpanCategory, metadata?: Record<string, unknown>): string {
    const spanId = `span_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.activeSpans.set(spanId, {
      name,
      category,
      start: performance.now(),
      metadata,
    });
    return spanId;
  }

  /**
   * Ends an active performance span and logs it into the APM buffer.
   */
  public endSpan(spanId: string): PerformanceSpan | null {
    const active = this.activeSpans.get(spanId);
    if (!active) return null;

    this.activeSpans.delete(spanId);
    const durationMs = Math.round((performance.now() - active.start) * 100) / 100;
    const threshold = DEFAULT_SLOW_THRESHOLDS[active.category] ?? 300;
    const isSlow = durationMs > threshold;

    const span: PerformanceSpan = {
      id: spanId,
      name: active.name,
      category: active.category,
      startTime: Date.now(),
      durationMs,
      isSlow,
      metadata: active.metadata,
    };

    if (this.spans.length >= MAX_SPANS_BUFFER) {
      this.spans.shift(); // Maintain circular buffer to prevent memory leakage
    }
    this.spans.push(span);

    return span;
  }

  /**
   * Executes and measures an asynchronous function directly.
   */
  public async measure<T>(
    name: string,
    category: SpanCategory,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const spanId = this.startSpan(name, category, metadata);
    try {
      return await fn();
    } finally {
      this.endSpan(spanId);
    }
  }

  /**
   * Returns a statistical summary including average, max, and 95th percentile (P95) latency.
   */
  public getSummary(): ApmMetricsSummary {
    if (this.spans.length === 0) {
      return {
        totalSpansRecorded: 0,
        slowSpansCount: 0,
        averageDurationMs: 0,
        maxDurationMs: 0,
        p95DurationMs: 0,
        categoryBreakdown: {
          api: { count: 0, avgMs: 0 },
          db: { count: 0, avgMs: 0 },
          render: { count: 0, avgMs: 0 },
          navigation: { count: 0, avgMs: 0 },
          ai: { count: 0, avgMs: 0 },
          computation: { count: 0, avgMs: 0 },
        },
      };
    }

    const durations = this.spans.map((s) => s.durationMs).sort((a, b) => a - b);
    const total = durations.reduce((acc, d) => acc + d, 0);
    const slowCount = this.spans.filter((s) => s.isSlow).length;

    // Calculate P95
    const p95Index = Math.min(
      durations.length - 1,
      Math.floor(durations.length * 0.95)
    );

    const breakdown: Record<SpanCategory, { count: number; totalMs: number }> = {
      api: { count: 0, totalMs: 0 },
      db: { count: 0, totalMs: 0 },
      render: { count: 0, totalMs: 0 },
      navigation: { count: 0, totalMs: 0 },
      ai: { count: 0, totalMs: 0 },
      computation: { count: 0, totalMs: 0 },
    };

    for (const s of this.spans) {
      if (breakdown[s.category]) {
        breakdown[s.category].count += 1;
        breakdown[s.category].totalMs += s.durationMs;
      }
    }

    const categoryBreakdown: any = {};
    for (const [cat, data] of Object.entries(breakdown)) {
      categoryBreakdown[cat] = {
        count: data.count,
        avgMs: data.count > 0 ? Math.round((data.totalMs / data.count) * 100) / 100 : 0,
      };
    }

    return {
      totalSpansRecorded: this.spans.length,
      slowSpansCount: slowCount,
      averageDurationMs: Math.round((total / durations.length) * 100) / 100,
      maxDurationMs: durations[durations.length - 1],
      p95DurationMs: durations[p95Index],
      categoryBreakdown,
    };
  }

  /**
   * Returns recent recorded spans.
   */
  public getRecentSpans(limit: number = 20): PerformanceSpan[] {
    return this.spans.slice(-limit);
  }

  /**
   * Clears APM recorded metrics.
   */
  public clear(): void {
    this.spans = [];
    this.activeSpans.clear();
  }
}

export const apm = new PerformanceMonitor();
