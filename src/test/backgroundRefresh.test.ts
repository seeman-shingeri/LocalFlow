import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackgroundRefreshManager } from '@/lib/backgroundRefresh';

describe('Enterprise Background Data Refresh Scheduler (backgroundRefresh)', () => {
  let manager: BackgroundRefreshManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new BackgroundRefreshManager();
  });

  afterEach(() => {
    manager.stop();
    vi.restoreAllMocks();
  });

  it('registers and executes background tasks', async () => {
    const mockTask = vi.fn().mockResolvedValue(undefined);
    manager.register('sync-invoices', 'Sync Invoices', mockTask, 10000);
    manager.start();

    const tasks = manager.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('sync-invoices');

    // Advance timer by 10s
    await vi.advanceTimersByTimeAsync(10000);
    expect(mockTask).toHaveBeenCalledTimes(1);

    // Advance by another 10s
    await vi.advanceTimersByTimeAsync(10000);
    expect(mockTask).toHaveBeenCalledTimes(2);
  });

  it('triggers task immediately via trigger()', async () => {
    const mockTask = vi.fn().mockResolvedValue(undefined);
    manager.register('sync-notifications', 'Sync Notifications', mockTask, 60000);

    const triggered = await manager.trigger('sync-notifications');
    expect(triggered).toBe(true);
    expect(mockTask).toHaveBeenCalledTimes(1);
  });

  it('handles task failures gracefully without crashing the scheduler', async () => {
    const failingTask = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'));
    manager.register('failing-endpoint', 'Failing Task', failingTask, 5000);
    manager.start();

    await vi.advanceTimersByTimeAsync(5000);
    expect(failingTask).toHaveBeenCalledTimes(1);

    const tasks = manager.getTasks();
    expect(tasks[0].status).toBe('failed');
    expect(tasks[0].errorCount).toBe(1);
  });

  it('unregisters tasks cleanly and cancels active intervals', async () => {
    const mockTask = vi.fn().mockResolvedValue(undefined);
    manager.register('sync-metrics', 'Sync Metrics', mockTask, 10000);
    manager.start();

    const unregistered = manager.unregister('sync-metrics');
    expect(unregistered).toBe(true);
    expect(manager.getTasks()).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(20000);
    expect(mockTask).not.toHaveBeenCalled();
  });

  it('pauses and resumes tasks on stop() and start()', async () => {
    const mockTask = vi.fn().mockResolvedValue(undefined);
    manager.register('sync-crm', 'Sync CRM', mockTask, 10000);
    manager.start();

    manager.stop();
    await vi.advanceTimersByTimeAsync(20000);
    expect(mockTask).not.toHaveBeenCalled();

    manager.start();
    await vi.advanceTimersByTimeAsync(10000);
    expect(mockTask).toHaveBeenCalledTimes(1);
  });
});
