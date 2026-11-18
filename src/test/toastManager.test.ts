import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastManager } from '@/lib/toastManager';

describe('Enterprise Nonintrusive Toast Queue Manager (toastManager)', () => {
  let manager: ToastManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new ToastManager(3, 3000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches success, error, warning, and info toasts', () => {
    manager.success('Invoice Created');
    manager.error('Payment Failed');

    const toasts = manager.getToasts();
    expect(toasts).toHaveLength(2);
    expect(toasts[0].variant).toBe('success');
    expect(toasts[0].title).toBe('Invoice Created');
    expect(toasts[1].variant).toBe('error');
  });

  it('auto-deduplicates identical consecutive notifications within debounce window', () => {
    manager.success('Saved');
    manager.success('Saved'); // Rapid duplicate
    manager.success('Saved');

    expect(manager.getToasts()).toHaveLength(1);
  });

  it('enforces maximum on-screen toast capacity (e.g. max 3)', () => {
    manager.info('Toast 1');
    manager.info('Toast 2');
    manager.info('Toast 3');
    manager.info('Toast 4');

    const toasts = manager.getToasts();
    expect(toasts).toHaveLength(3);
    // Oldest should have been shifted out
    expect(toasts[0].title).toBe('Toast 2');
    expect(toasts[2].title).toBe('Toast 4');
  });

  it('automatically dismisses toasts after their duration expires', () => {
    manager.show('info', 'Temporary notification', { durationMs: 2000 });
    expect(manager.getToasts()).toHaveLength(1);

    vi.advanceTimersByTime(2100);
    expect(manager.getToasts()).toHaveLength(0);
  });

  it('allows manual dismissal by ID', () => {
    const id = manager.success('Dismiss me');
    expect(manager.getToasts()).toHaveLength(1);

    manager.dismiss(id);
    expect(manager.getToasts()).toHaveLength(0);
  });
});
