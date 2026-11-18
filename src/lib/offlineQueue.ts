/**
 * LocalFlow AI — Enterprise Offline Mutation Queue & Network Reconnect Syncer
 *
 * Persists mutations during network disconnections, automatically monitors
 * browser online/offline events, and synchronizes queued operations sequentially
 * once connectivity is restored.
 */

export type OfflineMutationStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface QueuedMutation {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
  status: OfflineMutationStatus;
  retries: number;
  lastError?: string;
}

export type MutationExecutor = (mutation: QueuedMutation) => Promise<boolean>;

const STORAGE_KEY = 'localflow_offline_mutation_queue';

export class OfflineMutationQueue {
  private queue: QueuedMutation[] = [];
  private isProcessing: boolean = false;
  private onlineListener: (() => void) | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Adds an action to the offline queue and persists to storage.
   */
  enqueue(action: string, payload: any): QueuedMutation {
    const item: QueuedMutation = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      payload,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    };

    this.queue.push(item);
    this.saveToStorage();
    return item;
  }

  /**
   * Removes a mutation by ID.
   */
  remove(id: string): boolean {
    const initialLen = this.queue.length;
    this.queue = this.queue.filter((m) => m.id !== id);
    const removed = this.queue.length !== initialLen;
    if (removed) this.saveToStorage();
    return removed;
  }

  /**
   * Returns all pending mutations.
   */
  getPending(): QueuedMutation[] {
    return this.queue.filter((m) => m.status === 'pending' || m.status === 'failed');
  }

  /**
   * Checks current browser online status.
   */
  isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Flushes all pending mutations using the provided executor.
   */
  async flush(executor: MutationExecutor): Promise<{ synced: number; failed: number }> {
    if (this.isProcessing) return { synced: 0, failed: 0 };
    this.isProcessing = true;

    let synced = 0;
    let failed = 0;

    const pending = this.getPending();

    for (const item of pending) {
      item.status = 'syncing';
      try {
        const success = await executor(item);
        if (success) {
          item.status = 'synced';
          this.remove(item.id);
          synced++;
        } else {
          item.status = 'failed';
          item.retries++;
          failed++;
        }
      } catch (err) {
        item.status = 'failed';
        item.retries++;
        item.lastError = err instanceof Error ? err.message : String(err);
        failed++;
      }
    }

    this.saveToStorage();
    this.isProcessing = false;
    return { synced, failed };
  }

  /**
   * Starts automatic synchronization on window 'online' event.
   */
  startAutoSync(executor: MutationExecutor): () => void {
    if (typeof window === 'undefined') return () => {};

    this.onlineListener = () => {
      this.flush(executor);
    };

    window.addEventListener('online', this.onlineListener);

    return () => {
      if (this.onlineListener) {
        window.removeEventListener('online', this.onlineListener);
        this.onlineListener = null;
      }
    };
  }

  /**
   * Clears the entire queue.
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch {}
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch {
      this.queue = [];
    }
  }
}

export const offlineMutationQueue = new OfflineMutationQueue();
