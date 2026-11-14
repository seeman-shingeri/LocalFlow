import { describe, it, expect, beforeEach } from 'vitest';
import { idempotency } from '@/lib/idempotencyGuard';

describe('Enterprise Idempotency & Duplicate Request Prevention (idempotencyGuard)', () => {
  beforeEach(() => {
    idempotency.clear();
  });

  it('generates consistent, deterministic idempotency keys for identical operations and payloads', () => {
    const key1 = idempotency.generateKey('create_invoice', { customerId: 'c1', total: 50000 });
    const key2 = idempotency.generateKey('create_invoice', { customerId: 'c1', total: 50000 });
    const key3 = idempotency.generateKey('create_invoice', { customerId: 'c2', total: 50000 });

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('prevents duplicate concurrent execution when user clicks multiple times in rapid succession', async () => {
    let callCount = 0;
    const mockAction = async () => {
      callCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 60));
      return { id: 'payment-101', status: 'success' };
    };

    const key = 'payment:inv-123:5000';

    // Simulate 3 rapid taps on "Confirm Payment" button
    const [res1, res2, res3] = await Promise.all([
      idempotency.execute(key, mockAction),
      idempotency.execute(key, mockAction),
      idempotency.execute(key, mockAction),
    ]);

    expect(callCount).toBe(1);
    expect(res1).toEqual({ id: 'payment-101', status: 'success' });
    expect(res2).toEqual(res1);
    expect(res3).toEqual(res1);
  });

  it('serves cached result within retention window and skips duplicate execution', async () => {
    let callCount = 0;
    const action = async () => {
      callCount += 1;
      return { token: 'rec-123' };
    };

    const key = 'record:unique';
    const first = await idempotency.execute(key, action, { retentionMs: 1000 });
    const second = await idempotency.execute(key, action, { retentionMs: 1000 });

    expect(callCount).toBe(1);
    expect(first).toEqual(second);
  });

  it('cleans up in-flight lock upon failure so users can retry after correcting errors', async () => {
    let attempts = 0;
    const failingAction = async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('Network timeout');
      }
      return { success: true };
    };

    const key = 'retryable-action';

    await expect(idempotency.execute(key, failingAction)).rejects.toThrow('Network timeout');

    // Second attempt should be allowed to run because lock was released
    const second = await idempotency.execute(key, failingAction);
    expect(second).toEqual({ success: true });
    expect(attempts).toBe(2);
  });
});
