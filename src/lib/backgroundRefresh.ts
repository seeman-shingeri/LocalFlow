/**
 * LocalFlow AI — Enterprise Background Data Refresh Scheduler
 *
 * Coordinates non-critical background data polling (notifications, overdue counts, calendar updates)
 * with Page Visibility API awareness (pausing polling when tab is hidden/minimized),
 * automatic immediate refetch on tab focus, and network reconnection hooks.
 */

export type TaskStatus = 'idle' | 'running' | 'paused' | 'failed';

export interface BackgroundTask {
  id: string;
  name: string;
  intervalMs: number;
  execute: () => Promise<void>;
  lastRunTime: number | null;
  status: TaskStatus;
  errorCount: number;
  timerId?: any;
}

export class BackgroundRefreshManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private isRunning: boolean = false;
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;

  /**
   * Registers a background task.
   */
  register(
    id: string,
    name: string,
    execute: () => Promise<void>,
    intervalMs: number = 60000
  ): void {
    if (this.tasks.has(id)) {
      this.unregister(id);
    }

    const task: BackgroundTask = {
      id,
      name,
      intervalMs: Math.max(5000, intervalMs), // Minimum 5s threshold
      execute,
      lastRunTime: null,
      status: 'idle',
      errorCount: 0,
    };

    this.tasks.set(id, task);

    if (this.isRunning && this.isDocumentVisible()) {
      this.scheduleTask(task);
    }
  }

  /**
   * Unregisters and clears an existing background task.
   */
  unregister(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    if (task.timerId) {
      clearInterval(task.timerId);
    }
    return this.tasks.delete(id);
  }

  /**
   * Starts all registered tasks and hooks into window visibility and online events.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (this.isDocumentVisible()) {
          this.resumeAllTasks();
        } else {
          this.pauseAllTasks();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    if (typeof window !== 'undefined') {
      this.onlineHandler = () => {
        // Trigger immediate background sync upon regaining internet connection
        this.triggerAll();
      };
      window.addEventListener('online', this.onlineHandler);
    }

    if (this.isDocumentVisible()) {
      this.tasks.forEach((task) => this.scheduleTask(task));
    }
  }

  /**
   * Stops and clears all background polling loops and event listeners.
   */
  stop(): void {
    this.isRunning = false;

    this.tasks.forEach((task) => {
      if (task.timerId) {
        clearInterval(task.timerId);
        task.timerId = undefined;
      }
      task.status = 'paused';
    });

    if (typeof document !== 'undefined' && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (typeof window !== 'undefined' && this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
  }

  /**
   * Triggers an individual task immediately.
   */
  async trigger(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    await this.runTask(task);
    return true;
  }

  /**
   * Triggers all registered tasks immediately (e.g. on manual user sync).
   */
  async triggerAll(): Promise<void> {
    const promises = Array.from(this.tasks.values()).map((task) => this.runTask(task));
    await Promise.allSettled(promises);
  }

  /**
   * Returns metadata for all registered background tasks.
   */
  getTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values());
  }

  private isDocumentVisible(): boolean {
    if (typeof document === 'undefined') return true;
    return document.visibilityState !== 'hidden';
  }

  private scheduleTask(task: BackgroundTask): void {
    if (task.timerId) clearInterval(task.timerId);

    task.timerId = setInterval(async () => {
      if (this.isDocumentVisible()) {
        await this.runTask(task);
      }
    }, task.intervalMs);
  }

  private async runTask(task: BackgroundTask): Promise<void> {
    if (task.status === 'running') return;

    task.status = 'running';
    try {
      await task.execute();
      task.lastRunTime = Date.now();
      task.status = 'idle';
      task.errorCount = 0;
    } catch {
      task.status = 'failed';
      task.errorCount++;
    }
  }

  private resumeAllTasks(): void {
    this.tasks.forEach((task) => {
      task.status = 'idle';
      this.scheduleTask(task);
    });
    // Trigger quick refresh on tab re-entry
    this.triggerAll();
  }

  private pauseAllTasks(): void {
    this.tasks.forEach((task) => {
      if (task.timerId) {
        clearInterval(task.timerId);
        task.timerId = undefined;
      }
      task.status = 'paused';
    });
  }
}

export const backgroundRefreshManager = new BackgroundRefreshManager();
