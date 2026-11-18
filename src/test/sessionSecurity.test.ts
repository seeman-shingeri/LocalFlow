import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionSecurityManager } from '@/lib/sessionSecurity';

describe('Enterprise Session Security & Inactivity Guardian (sessionSecurity)', () => {
  let manager: SessionSecurityManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new SessionSecurityManager({
      idleTimeoutMs: 10000, // 10s
      warningThresholdMs: 3000, // 3s before timeout (at 7s)
      checkIntervalMs: 1000,
    });
  });

  afterEach(() => {
    manager.stop();
    vi.restoreAllMocks();
  });

  it('calculates remaining idle time accurately', () => {
    manager.start();
    expect(manager.getRemainingIdleTimeMs()).toBe(10000);

    vi.advanceTimersByTime(4000);
    expect(manager.getRemainingIdleTimeMs()).toBe(6000);
  });

  it('triggers warning callback when remaining time hits warning threshold', () => {
    const warningCb = vi.fn();
    manager.onWarning(warningCb);
    manager.start();

    // Advance 6s -> 4s remaining (no warning yet)
    vi.advanceTimersByTime(6000);
    expect(warningCb).not.toHaveBeenCalled();

    // Advance another 1.5s -> 2.5s remaining (warning threshold reached)
    vi.advanceTimersByTime(1500);
    expect(warningCb).toHaveBeenCalledTimes(1);
    expect(manager.isWarningState()).toBe(true);
  });

  it('triggers timeout callback and terminates session after full timeout duration', () => {
    const timeoutCb = vi.fn();
    manager.onTimeout(timeoutCb);
    manager.start();

    vi.advanceTimersByTime(10500);
    expect(timeoutCb).toHaveBeenCalledTimes(1);
    expect(manager.getRemainingIdleTimeMs()).toBe(0);
  });

  it('resets idle timer when user records activity / extends session', () => {
    const warningCb = vi.fn();
    const timeoutCb = vi.fn();
    manager.onWarning(warningCb);
    manager.onTimeout(timeoutCb);
    manager.start();

    // Advance 6s
    vi.advanceTimersByTime(6000);
    expect(manager.getRemainingIdleTimeMs()).toBe(4000);

    // User interacts
    manager.recordActivity();
    expect(manager.getRemainingIdleTimeMs()).toBe(10000);

    // Advance 5s
    vi.advanceTimersByTime(5000);
    expect(warningCb).not.toHaveBeenCalled();
    expect(timeoutCb).not.toHaveBeenCalled();
  });
});
