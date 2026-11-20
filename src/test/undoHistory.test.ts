import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UndoHistoryManager } from '@/lib/undoHistory';

describe('Enterprise Undo/Redo Command History Manager (undoHistory)', () => {
  let manager: UndoHistoryManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new UndoHistoryManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pushes undoable action and executes undo callback on request', async () => {
    let customerStatus = 'archived';
    const undoFn = vi.fn(() => {
      customerStatus = 'active';
    });
    const redoFn = vi.fn(() => {
      customerStatus = 'archived';
    });

    manager.push('Customer archived', undoFn, redoFn, 5000);

    expect(manager.canUndo()).toBe(true);
    expect(customerStatus).toBe('archived');

    const result = await manager.undo();
    expect(result.success).toBe(true);
    expect(undoFn).toHaveBeenCalledTimes(1);
    expect(customerStatus).toBe('active');
  });

  it('allows redoing previously undone actions', async () => {
    let leadStage = 'won';
    const undo = vi.fn(() => {
      leadStage = 'proposal';
    });
    const redo = vi.fn(() => {
      leadStage = 'won';
    });

    manager.push('Lead marked as Won', undo, redo);
    await manager.undo();
    expect(leadStage).toBe('proposal');

    expect(manager.canRedo()).toBe(true);
    const redoResult = await manager.redo();
    expect(redoResult.success).toBe(true);
    expect(redo).toHaveBeenCalledTimes(1);
    expect(leadStage).toBe('won');
  });

  it('rejects undo when time-to-live expiration has passed', async () => {
    const undoFn = vi.fn();
    manager.push('Invoice cancelled', undoFn, vi.fn(), 3000);

    // Advance 4s (past 3s expiration)
    vi.advanceTimersByTime(4000);

    expect(manager.canUndo()).toBe(false);
    const result = await manager.undo();
    expect(result.success).toBe(false);
    expect(undoFn).not.toHaveBeenCalled();
  });

  it('undoes a specific command by ID', async () => {
    const undo1 = vi.fn();
    const undo2 = vi.fn();

    const cmd1 = manager.push('Action 1', undo1, vi.fn(), 10000);
    manager.push('Action 2', undo2, vi.fn(), 10000);

    // Undo cmd1 specifically
    const result = await manager.undo(cmd1.id);
    expect(result.success).toBe(true);
    expect(undo1).toHaveBeenCalledTimes(1);
    expect(undo2).not.toHaveBeenCalled();
  });
});
