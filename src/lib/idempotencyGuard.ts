/**
 * Enterprise Idempotency & Duplicate Request Prevention
 * Prevents accidental double submissions, duplicate payments, and duplicate invoice creation.
 * Modeled after Stripe and Salesforce idempotency standards.
 */

interface InFlightLock<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface CompletedExecution<T> {
  result: T;
  timestamp: number;
}

export interface IdempotencyOptions {
  lockTimeoutMs?: number; // Max time to hold lock if promise hangs (default: 15,000ms)
  retentionMs?: number; // Time to retain completed result to prevent duplicate retries (default: 5,000ms)
}

const DEFAULT_LOCK_TIMEOUT_MS = 15_000;
const DEFAULT_RETENTION_MS = 5_000;

class IdempotencyRegistry {
  private inFlight = new Map<string, InFlightLock<any>>();
  private completed = new Map<string, CompletedExecution<any>>();

  /**
   * Generates a deterministic idempotency key from an operation prefix and structured payload.
   */
  generateKey(operation: string, payload: unknown): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    // Simple deterministic hash
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `${operation}:${Math.abs(hash).toString(36)}`;
  }

  /**
   * Executes an asynchronous mutation protected by an idempotency lock.
   * If a matching mutation is already running, subsequent parallel calls reuse the in-flight promise.
   * If a matching mutation succeeded within the retention window, returns the previous result.
   */
  async execute<T>(
    idempotencyKey: string,
    action: () => Promise<T>,
    options: IdempotencyOptions = {}
  ): Promise<T> {
    const now = Date.now();
    const lockTimeout = options.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS;
    const retention = options.retentionMs ?? DEFAULT_RETENTION_MS;

    // 1. Check if recently completed within retention window
    const recent = this.completed.get(idempotencyKey);
    if (recent && now - recent.timestamp < retention) {
      return recent.result;
    }

    // 2. Check if currently executing
    const active = this.inFlight.get(idempotencyKey);
    if (active) {
      // If lock hasn't timed out, await active promise
      if (now - active.timestamp < lockTimeout) {
        return active.promise;
      }
      // Lock expired, delete and allow retry
      this.inFlight.delete(idempotencyKey);
    }

    // 3. Acquire lock and execute
    const promise = (async () => {
      try {
        const result = await action();
        this.completed.set(idempotencyKey, { result, timestamp: Date.now() });
        return result;
      } finally {
        this.inFlight.delete(idempotencyKey);
      }
    })();

    this.inFlight.set(idempotencyKey, { promise, timestamp: now });
    return promise;
  }

  /**
   * Checks if an operation key is currently locked in flight.
   */
  isLocked(idempotencyKey: string): boolean {
    return this.inFlight.has(idempotencyKey);
  }

  /**
   * Clears registry entries (useful for testing or cache resets).
   */
  clear(): void {
    this.inFlight.clear();
    this.completed.clear();
  }
}

export const idempotency = new IdempotencyRegistry();
