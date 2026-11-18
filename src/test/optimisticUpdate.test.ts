import { describe, it, expect, vi } from 'vitest';
import { OptimisticManager } from '@/lib/optimisticUpdate';

interface ItemState {
  id: string;
  name: string;
  status: 'active' | 'archived';
}

describe('Enterprise Optimistic UI Update Manager (optimisticUpdate)', () => {
  it('optimistically applies state changes and captures snapshot', () => {
    const manager = new OptimisticManager<ItemState[]>();
    const initial: ItemState[] = [{ id: '1', name: 'Item 1', status: 'active' }];

    const updated = manager.apply('tx-1', initial, (items) =>
      items.map((i) => (i.id === '1' ? { ...i, status: 'archived' as const } : i))
    );

    expect(updated[0].status).toBe('archived');
    expect(manager.getPendingTransactions()).toHaveLength(1);
    expect(manager.getPendingTransactions()[0].originalSnapshot[0].status).toBe('active');
  });

  it('commits successfully and cleans up pending transactions', () => {
    const manager = new OptimisticManager<ItemState[]>();
    const initial: ItemState[] = [{ id: '1', name: 'Item 1', status: 'active' }];

    manager.apply('tx-1', initial, (items) =>
      items.map((i) => (i.id === '1' ? { ...i, status: 'archived' as const } : i))
    );

    const committed = manager.commit('tx-1');
    expect(committed).toBe(true);
    expect(manager.getPendingTransactions()).toHaveLength(0);
  });

  it('rolls back to original snapshot when server mutation fails', () => {
    const manager = new OptimisticManager<ItemState[]>();
    const initial: ItemState[] = [{ id: '1', name: 'Item 1', status: 'active' }];

    manager.apply('tx-1', initial, (items) =>
      items.map((i) => (i.id === '1' ? { ...i, status: 'archived' as const } : i))
    );

    const rollback = manager.rollback('tx-1', new Error('Database connection failed'));
    expect(rollback.success).toBe(true);
    expect(rollback.restoredState?.[0].status).toBe('active');
    expect(manager.getPendingTransactions()).toHaveLength(0);
  });

  it('executes successful flow with execute() orchestration helper', async () => {
    const manager = new OptimisticManager<ItemState[]>();
    let state: ItemState[] = [{ id: '1', name: 'Item 1', status: 'active' }];
    const onStateChange = vi.fn((newState) => {
      state = newState;
    });

    const remoteCall = vi.fn().mockResolvedValue({ ok: true });

    const result = await manager.execute(
      'tx-exec-1',
      state,
      (items) => items.map((i) => ({ ...i, status: 'archived' })),
      remoteCall,
      onStateChange
    );

    expect(result).toEqual({ ok: true });
    expect(remoteCall).toHaveBeenCalledTimes(1);
    expect(state[0].status).toBe('archived');
    expect(manager.getPendingTransactions()).toHaveLength(0);
  });

  it('automatically rolls back and triggers state change on remote rejection in execute()', async () => {
    const manager = new OptimisticManager<ItemState[]>();
    let state: ItemState[] = [{ id: '1', name: 'Original', status: 'active' }];
    const onStateChange = vi.fn((newState) => {
      state = newState;
    });

    const remoteCall = vi.fn().mockRejectedValue(new Error('Network offline'));

    await expect(
      manager.execute(
        'tx-exec-2',
        state,
        (items) => items.map((i) => ({ ...i, name: 'Optimistic' })),
        remoteCall,
        onStateChange
      )
    ).rejects.toThrow('Network offline');

    // Should have updated to optimistic, then rolled back to original
    expect(onStateChange).toHaveBeenCalledTimes(2);
    expect(state[0].name).toBe('Original');
    expect(manager.getPendingTransactions()).toHaveLength(0);
  });
});
