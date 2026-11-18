/**
 * LocalFlow AI — Enterprise Exponential Backoff Retry Policy with Jitter
 *
 * Implements Google SRE-grade transient failure recovery:
 * exponential backoff, randomized jitter to eliminate thundering herds,
 * and intelligent HTTP/network error classification.
 */

export interface RetryPolicyOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitter?: boolean;
  isRetryable?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_STRINGS = [
  'network',
  'timeout',
  'failed to fetch',
  'connection reset',
  'socket hang up',
  'rate limit',
  'econnreset',
  'etimedout',
];

/**
 * Determines whether a thrown exception represents a transient, retryable failure.
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Check HTTP response status codes
  if (typeof error === 'object' && error !== null) {
    const status = (error as any).status || (error as any).statusCode;
    if (typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status)) {
      return true;
    }
  }

  // Check error message strings
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return RETRYABLE_ERROR_STRINGS.some((s) => message.includes(s));
}

/**
 * Calculates exponential backoff delay with full jitter:
 * delay = min(maxDelay, initialDelay * (backoffFactor ^ attempt)) * random(0.5, 1.0)
 */
export function calculateBackoffDelay(
  attempt: number,
  options: RetryPolicyOptions = {}
): number {
  const {
    initialDelayMs = 250,
    maxDelayMs = 4000,
    backoffFactor = 2,
    jitter = true,
  } = options;

  const rawDelay = Math.min(maxDelayMs, initialDelayMs * Math.pow(backoffFactor, attempt - 1));

  if (!jitter) {
    return Math.round(rawDelay);
  }

  // Full randomized jitter between 50% and 100% of rawDelay
  const jitterFactor = 0.5 + Math.random() * 0.5;
  return Math.round(rawDelay * jitterFactor);
}

/**
 * Executes an async operation with automatic retry logic on transient failures.
 */
export async function executeWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryPolicyOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    isRetryable = isRetryableError,
    onRetry,
  } = options;

  let attempt = 1;

  while (true) {
    try {
      return await operation(attempt);
    } catch (err) {
      if (attempt >= maxAttempts || !isRetryable(err, attempt)) {
        throw err;
      }

      const nextDelay = calculateBackoffDelay(attempt, options);
      if (onRetry) {
        onRetry(err, attempt, nextDelay);
      }

      await new Promise((resolve) => setTimeout(resolve, nextDelay));
      attempt++;
    }
  }
}
