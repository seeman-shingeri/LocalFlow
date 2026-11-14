import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealtimeConnectionManager } from '@/lib/realtimeRecovery';

describe('Enterprise Realtime Connection Recovery (realtimeRecovery)', () => {
  let manager: RealtimeConnectionManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new RealtimeConnectionManager({
      heartbeatIntervalMs: 5000,
      baseBackoffMs: 100,
      maxBackoffMs: 1000,
      maxRetryAttempts: 3,
    });
  });

  afterEach(() => {
    manager.dispose();
    vi.useRealTimers();
  });

  it('initializes in connected state and allows subscribing to status changes', () => {
    const states: string[] = [];
    const unsubscribe = manager.onStatusChange((s) => states.push(s));

    expect(manager.getState()).toBe('connected');
    expect(states).toEqual(['connected']);

    unsubscribe();
  });

  it('calculates exponential backoff delay bounded by maxBackoffMs', () => {
    const d1 = manager.calculateBackoffDelay(1); // ~ 200ms
    const d2 = manager.calculateBackoffDelay(2); // ~ 400ms
    const d5 = manager.calculateBackoffDelay(5); // capped near 1000ms

    expect(d1).toBeGreaterThanOrEqual(180);
    expect(d2).toBeGreaterThan(d1);
    expect(d5).toBeLessThanOrEqual(1300); // 1000 + jitter
  });

  it('executes registered re-sync handlers when connection recovers', async () => {
    const syncHandler = vi.fn();
    manager.onReconnected(syncHandler);

    manager.setPingFunction(async () => true);

    const recovered = await manager.attemptRecovery();

    expect(recovered).toBe(true);
    expect(manager.getState()).toBe('connected');
    expect(syncHandler).toHaveBeenCalledTimes(1);
  });

  it('triggers reconnect backoff when heartbeat ping fails', async () => {
    let shouldSucceed = false;
    manager.setPingFunction(async () => shouldSucceed);

    // Initial heartbeat trigger
    vi.advanceTimersByTime(5000);

    // Flush microtasks
    await Promise.resolve();

    expect(manager.getState()).toBe('reconnecting');
    expect(manager.getRetryCount()).toBe(1);
  });
});
