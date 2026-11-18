import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenBucketRateLimiter, SlidingWindowRateLimiter } from '@/lib/rateLimiter';

describe('Enterprise Token Bucket & Sliding Window Rate Limiter (rateLimiter)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('TokenBucketRateLimiter', () => {
    it('permits consumption when tokens are available and decrements tokens', () => {
      const limiter = new TokenBucketRateLimiter(5, 1);
      const res1 = limiter.tryConsume('user-1', 2);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(3);

      const res2 = limiter.tryConsume('user-1', 3);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(0);
    });

    it('rejects consumption when tokens are exhausted and calculates retryAfterMs', () => {
      const limiter = new TokenBucketRateLimiter(2, 1); // 1 token per sec
      limiter.tryConsume('user-1', 2);

      const rejected = limiter.tryConsume('user-1', 1);
      expect(rejected.allowed).toBe(false);
      expect(rejected.remaining).toBe(0);
      expect(rejected.retryAfterMs).toBeGreaterThan(0);
    });

    it('refills tokens over time at configured rate', () => {
      const limiter = new TokenBucketRateLimiter(5, 2); // 2 tokens per sec
      limiter.tryConsume('user-1', 5);

      vi.advanceTimersByTime(1000); // 1 sec -> +2 tokens
      const retry = limiter.tryConsume('user-1', 2);
      expect(retry.allowed).toBe(true);
    });
  });

  describe('SlidingWindowRateLimiter', () => {
    it('allows requests up to maxRequests threshold within time window', () => {
      const limiter = new SlidingWindowRateLimiter(3, 10000); // 3 per 10s

      expect(limiter.isAllowed('api-key').allowed).toBe(true);
      expect(limiter.isAllowed('api-key').allowed).toBe(true);
      expect(limiter.isAllowed('api-key').allowed).toBe(true);

      const fourth = limiter.isAllowed('api-key');
      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBe(0);
      expect(fourth.retryAfterMs).toBeGreaterThan(0);
    });

    it('evicts expired requests from sliding window after window expires', () => {
      const limiter = new SlidingWindowRateLimiter(2, 5000);
      limiter.isAllowed('endpoint');
      limiter.isAllowed('endpoint');

      expect(limiter.isAllowed('endpoint').allowed).toBe(false);

      // Advance past window duration
      vi.advanceTimersByTime(5100);
      expect(limiter.isAllowed('endpoint').allowed).toBe(true);
    });
  });
});
