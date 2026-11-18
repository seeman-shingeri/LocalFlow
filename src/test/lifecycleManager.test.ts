import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifecycleManager } from '@/lib/lifecycleManager';

describe('Enterprise Lifecycle & Memory Leak Disposer (lifecycleManager)', () => {
  let lifecycle: LifecycleManager;

  beforeEach(() => {
    vi.useFakeTimers();
    lifecycle = new LifecycleManager();
  });

  it('manages custom disposers and executes them on disposeAll()', async () => {
    const cleanupA = vi.fn();
    const cleanupB = vi.fn().mockResolvedValue(undefined);

    lifecycle.add(cleanupA);
    lifecycle.add(cleanupB);
    expect(lifecycle.count()).toBe(2);

    await lifecycle.disposeAll();
    expect(cleanupA).toHaveBeenCalledTimes(1);
    expect(cleanupB).toHaveBeenCalledTimes(1);
    expect(lifecycle.count()).toBe(0);
    expect(lifecycle.isDisposed()).toBe(true);
  });

  it('allows manual early disposal of individual resources', () => {
    const cleanup = vi.fn();
    const removeEarly = lifecycle.add(cleanup);
    expect(lifecycle.count()).toBe(1);

    removeEarly();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(lifecycle.count()).toBe(0);
  });

  it('attaches and cleans up DOM event listeners automatically', async () => {
    const div = document.createElement('div');
    const handler = vi.fn();

    lifecycle.addEventListener(div, 'click', handler);

    div.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);

    await lifecycle.disposeAll();

    div.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1); // Not called again after disposal
  });

  it('cleans up intervals and timeouts on disposal', async () => {
    const intervalFn = vi.fn();
    const timeoutFn = vi.fn();

    lifecycle.setInterval(intervalFn, 100);
    lifecycle.setTimeout(timeoutFn, 500);

    vi.advanceTimersByTime(100);
    expect(intervalFn).toHaveBeenCalledTimes(1);

    await lifecycle.disposeAll();

    vi.advanceTimersByTime(1000);
    // Neither interval nor timeout should trigger further after disposal
    expect(intervalFn).toHaveBeenCalledTimes(1);
    expect(timeoutFn).not.toHaveBeenCalled();
  });

  it('aborts active AbortControllers on disposal', async () => {
    const controller = lifecycle.createAbortController();
    expect(controller.signal.aborted).toBe(false);

    await lifecycle.disposeAll();
    expect(controller.signal.aborted).toBe(true);
  });
});
