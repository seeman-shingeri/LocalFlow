/**
 * LocalFlow AI — Enterprise Token Bucket & Sliding Window Rate Limiter
 *
 * Protects expensive services (AI assistant, SMS/Email dispatch, report exports)
 * from client-side flooding and quota exhaustion using token bucket and sliding window algorithms.
 */

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetAt: number;
}

interface BucketState {
  tokens: number;
  lastRefillTime: number;
}

export class TokenBucketRateLimiter {
  private buckets: Map<string, BucketState> = new Map();
  private maxTokens: number;
  private refillRatePerSec: number;

  constructor(maxTokens: number = 10, refillRatePerSec: number = 2) {
    this.maxTokens = maxTokens;
    this.refillRatePerSec = refillRatePerSec;
  }

  /**
   * Attempts to consume specified tokens for a given bucket key.
   */
  tryConsume(key: string, tokensToConsume: number = 1): RateLimitStatus {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefillTime: now };
      this.buckets.set(key, bucket);
    } else {
      // Calculate token replenishment
      const elapsedSeconds = (now - bucket.lastRefillTime) / 1000;
      const tokensToAdd = elapsedSeconds * this.refillRatePerSec;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefillTime = now;
    }

    if (bucket.tokens >= tokensToConsume) {
      bucket.tokens -= tokensToConsume;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: 0,
        resetAt: now,
      };
    }

    // Calculate time required to accumulate missing tokens
    const deficit = tokensToConsume - bucket.tokens;
    const retryAfterMs = Math.ceil((deficit / this.refillRatePerSec) * 1000);

    return {
      allowed: false,
      remaining: Math.floor(bucket.tokens),
      retryAfterMs,
      resetAt: now + retryAfterMs,
    };
  }

  /**
   * Clears rate limit state for a key.
   */
  reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

export class SlidingWindowRateLimiter {
  private requestLog: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 5, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Checks whether an action is permitted within the sliding time window.
   */
  isAllowed(key: string): RateLimitStatus {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.requestLog.get(key) || [];
    // Evict timestamps older than the sliding window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      this.requestLog.set(key, timestamps);
      return {
        allowed: true,
        remaining: this.maxRequests - timestamps.length,
        retryAfterMs: 0,
        resetAt: now,
      };
    }

    // Blocked: retry after earliest record leaves the window
    const oldest = timestamps[0];
    const retryAfterMs = Math.max(0, oldest + this.windowMs - now);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
      resetAt: oldest + this.windowMs,
    };
  }

  /**
   * Clears sliding window history.
   */
  reset(key?: string): void {
    if (key) {
      this.requestLog.delete(key);
    } else {
      this.requestLog.clear();
    }
  }
}
