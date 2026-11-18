import { describe, it, expect, vi } from 'vitest';
import {
  isRetryableError,
  calculateBackoffDelay,
  executeWithRetry,
} from '@/lib/retryPolicy';

describe('Enterprise Exponential Backoff Retry Policy (retryPolicy)', () => {
  it('correctly classifies retryable network and HTTP status errors', () => {
    expect(isRetryableError(new Error('TypeError: Failed to fetch'))).toBe(true);
    expect(isRetryableError(new Error('ETIMEDOUT: Connection timed out'))).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 429 })).toBe(true);

    // Non-retryable
    expect(isRetryableError(new Error('Validation failed: name is required'))).toBe(false);
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 401 })).toBe(false);
  });

  it('calculates deterministic backoff when jitter is disabled', () => {
    const opts = { initialDelayMs: 200, backoffFactor: 2, maxDelayMs: 2000, jitter: false };
    expect(calculateBackoffDelay(1, opts)).toBe(200);
    expect(calculateBackoffDelay(2, opts)).toBe(400);
    expect(calculateBackoffDelay(3, opts)).toBe(800);
    expect(calculateBackoffDelay(4, opts)).toBe(1600);
    expect(calculateBackoffDelay(5, opts)).toBe(2000); // capped at maxDelayMs
  });

  it('successfully recovers and returns result after transient failure', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce({ data: 'success' });

    const onRetry = vi.fn();

    const result = await executeWithRetry(op, {
      maxAttempts: 3,
      initialDelayMs: 10,
      jitter: false,
      onRetry,
    });

    expect(result).toEqual({ data: 'success' });
    expect(op).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('throws immediately without retrying for non-retryable errors', async () => {
    const op = vi.fn().mockRejectedValue(new Error('Invalid password input'));

    await expect(
      executeWithRetry(op, { maxAttempts: 3, initialDelayMs: 5 })
    ).rejects.toThrow('Invalid password input');

    expect(op).toHaveBeenCalledTimes(1);
  });

  it('exhausts maxAttempts and throws final error when failure persists', async () => {
    const op = vi.fn().mockRejectedValue(new Error('Socket connection timeout'));

    await expect(
      executeWithRetry(op, { maxAttempts: 3, initialDelayMs: 10, jitter: false })
    ).rejects.toThrow('Socket connection timeout');

    expect(op).toHaveBeenCalledTimes(3);
  });
});
