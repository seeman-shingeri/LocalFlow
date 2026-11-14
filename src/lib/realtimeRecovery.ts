/**
 * Enterprise Realtime Connection Recovery & Resilience Manager
 * Manages WebSocket/realtime health, heartbeat pinging, exponential backoff reconnection,
 * and automatic data re-synchronization on network recovery.
 */

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface RecoveryConfig {
  heartbeatIntervalMs?: number; // default: 30,000ms
  baseBackoffMs?: number; // default: 1,000ms
  maxBackoffMs?: number; // default: 30,000ms
  maxRetryAttempts?: number; // default: 10
}

export type StatusListener = (status: ConnectionState) => void;
export type SyncHandler = () => Promise<void> | void;

export class RealtimeConnectionManager {
  private state: ConnectionState = 'connected';
  private retryCount: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private statusListeners = new Set<StatusListener>();
  private syncHandlers = new Set<SyncHandler>();
  private pingFn: (() => Promise<boolean>) | null = null;

  private config: Required<RecoveryConfig>;

  constructor(config: RecoveryConfig = {}) {
    this.config = {
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? 30_000,
      baseBackoffMs: config.baseBackoffMs ?? 1_000,
      maxBackoffMs: config.maxBackoffMs ?? 30_000,
      maxRetryAttempts: config.maxRetryAttempts ?? 10,
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Calculates exponential backoff delay with jitter.
   */
  public calculateBackoffDelay(attempt: number): number {
    const exp = Math.min(attempt, 6);
    const delay = Math.min(
      this.config.maxBackoffMs,
      this.config.baseBackoffMs * Math.pow(2, exp)
    );
    // Add 10-20% random jitter to avoid thundering herd
    const jitter = delay * (0.1 + Math.random() * 0.1);
    return Math.round(delay + jitter);
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public getRetryCount(): number {
    return this.retryCount;
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.state);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public onReconnected(handler: SyncHandler): () => void {
    this.syncHandlers.add(handler);
    return () => {
      this.syncHandlers.delete(handler);
    };
  }

  private setStatus(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.statusListeners.forEach((l) => l(newState));
    }
  }

  public setPingFunction(fn: () => Promise<boolean>): void {
    this.pingFn = fn;
    this.startHeartbeat();
  }

  public startHeartbeat(): void {
    this.stopHeartbeat();
    if (!this.pingFn) return;

    this.heartbeatTimer = setInterval(async () => {
      if (this.state === 'disconnected' || this.state === 'reconnecting') return;
      try {
        const isHealthy = await this.pingFn!();
        if (!isHealthy) {
          this.triggerReconnect();
        }
      } catch {
        this.triggerReconnect();
      }
    }, this.config.heartbeatIntervalMs);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public triggerReconnect(): void {
    if (this.reconnectTimer) return;
    this.setStatus('reconnecting');
    this.retryCount += 1;

    if (this.retryCount > this.config.maxRetryAttempts) {
      this.setStatus('disconnected');
      return;
    }

    const delay = this.calculateBackoffDelay(this.retryCount);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.attemptRecovery();
    }, delay);
  }

  public async attemptRecovery(): Promise<boolean> {
    this.setStatus('connecting');
    try {
      let healthy = true;
      if (this.pingFn) {
        healthy = await this.pingFn();
      }

      if (healthy) {
        this.retryCount = 0;
        this.setStatus('connected');
        // Notify all registered data consumers to re-sync
        for (const handler of this.syncHandlers) {
          try {
            await handler();
          } catch {
            // Non-blocking sync error
          }
        }
        return true;
      } else {
        this.triggerReconnect();
        return false;
      }
    } catch {
      this.triggerReconnect();
      return false;
    }
  }

  private handleOnline = (): void => {
    this.attemptRecovery();
  };

  private handleOffline = (): void => {
    this.setStatus('disconnected');
  };

  public dispose(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.statusListeners.clear();
    this.syncHandlers.clear();
  }
}

export const realtimeRecovery = new RealtimeConnectionManager();
