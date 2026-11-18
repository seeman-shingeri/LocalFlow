import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfflineMutationQueue } from '@/lib/offlineQueue';

describe('Enterprise Offline Mutation Queue & Network Reconnect Syncer (offlineQueue)', () => {
  let queue: OfflineMutationQueue;

  beforeEach(() => {
    localStorage.clear();
    queue = new OfflineMutationQueue();
  });

  it('enqueues mutations and persists them to localStorage', () => {
    const mut = queue.enqueue('customer.create', { name: 'Offline Client' });
    expect(mut.id).toMatch(/^mut-/);
    expect(mut.status).toBe('pending');

    const pending = queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].payload.name).toBe('Offline Client');
  });

  it('flushes pending mutations sequentially and removes successful items', async () => {
    queue.enqueue('note.add', { text: 'Note 1' });
    queue.enqueue('note.add', { text: 'Note 2' });

    const executor = vi.fn().mockResolvedValue(true);

    const report = await queue.flush(executor);
    expect(report.synced).toBe(2);
    expect(report.failed).toBe(0);
    expect(queue.getPending()).toHaveLength(0);
    expect(executor).toHaveBeenCalledTimes(2);
  });

  it('marks failed mutations and retains them for subsequent retries', async () => {
    queue.enqueue('invoice.sync', { id: 'inv-101' });

    const failingExecutor = vi.fn().mockRejectedValue(new Error('Server unavailable'));

    const report = await queue.flush(failingExecutor);
    expect(report.synced).toBe(0);
    expect(report.failed).toBe(1);

    const pending = queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe('failed');
    expect(pending[0].retries).toBe(1);
    expect(pending[0].lastError).toContain('Server unavailable');
  });

  it('manually removes individual mutations by ID', () => {
    const item1 = queue.enqueue('item.one', {});
    const item2 = queue.enqueue('item.two', {});

    expect(queue.remove(item1.id)).toBe(true);
    expect(queue.getPending()).toHaveLength(1);
    expect(queue.getPending()[0].id).toBe(item2.id);
  });
});
