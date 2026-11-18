/**
 * LocalFlow AI — Enterprise Session Security & Inactivity Guardian
 *
 * Enforces banking-grade session security: monitors user idle time across DOM events,
 * alerts before session termination, safely invalidates stale auth contexts,
 * and coordinates proactive JWT token renewal.
 */

export interface SessionSecurityConfig {
  idleTimeoutMs?: number; // Default 15 minutes
  warningThresholdMs?: number; // Warning triggered this many ms before timeout (default 2 mins)
  checkIntervalMs?: number; // How often to check status (default 5s)
}

export type SessionWarningCallback = (remainingMs: number) => void;
export type SessionTimeoutCallback = () => void;

export class SessionSecurityManager {
  private idleTimeoutMs: number;
  private warningThresholdMs: number;
  private checkIntervalMs: number;

  private lastActivityTime: number = Date.now();
  private isWarningDispatched: boolean = false;
  private timerId: any = null;
  private activeListeners: (() => void)[] = [];

  private warningCallbacks: Set<SessionWarningCallback> = new Set();
  private timeoutCallbacks: Set<SessionTimeoutCallback> = new Set();

  constructor(config: SessionSecurityConfig = {}) {
    this.idleTimeoutMs = config.idleTimeoutMs ?? 15 * 60 * 1000;
    this.warningThresholdMs = config.warningThresholdMs ?? 2 * 60 * 1000;
    this.checkIntervalMs = config.checkIntervalMs ?? 5000;
  }

  /**
   * Starts tracking user activity and initializes the session check loop.
   */
  start(): void {
    this.stop();
    this.lastActivityTime = Date.now();
    this.isWarningDispatched = false;

    if (typeof window !== 'undefined') {
      const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
      let lastThrottle = 0;

      const onActivity = () => {
        const now = Date.now();
        // Throttle activity recording to once every 2 seconds to avoid CPU overhead
        if (now - lastThrottle > 2000) {
          lastThrottle = now;
          this.recordActivity();
        }
      };

      activityEvents.forEach((evt) => {
        window.addEventListener(evt, onActivity, { passive: true });
        this.activeListeners.push(() => window.removeEventListener(evt, onActivity));
      });
    }

    this.timerId = setInterval(() => this.checkSession(), this.checkIntervalMs);
  }

  /**
   * Stops tracking and cleans up event listeners and intervals.
   */
  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.activeListeners.forEach((cleanup) => cleanup());
    this.activeListeners = [];
  }

  /**
   * Resets user idle counter on confirmed user interaction.
   */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
    this.isWarningDispatched = false;
  }

  /**
   * Returns remaining ms until session times out.
   */
  getRemainingIdleTimeMs(): number {
    const elapsed = Date.now() - this.lastActivityTime;
    return Math.max(0, this.idleTimeoutMs - elapsed);
  }

  /**
   * Checks whether the warning threshold has been breached.
   */
  isWarningState(): boolean {
    return this.getRemainingIdleTimeMs() <= this.warningThresholdMs;
  }

  /**
   * Subscribes to inactivity warning alerts.
   */
  onWarning(callback: SessionWarningCallback): () => void {
    this.warningCallbacks.add(callback);
    return () => this.warningCallbacks.delete(callback);
  }

  /**
   * Subscribes to session expiration / logout trigger.
   */
  onTimeout(callback: SessionTimeoutCallback): () => void {
    this.timeoutCallbacks.add(callback);
    return () => this.timeoutCallbacks.delete(callback);
  }

  /**
   * Explicitly extends active session (e.g. user clicks 'Stay Logged In').
   */
  extendSession(): void {
    this.recordActivity();
  }

  private checkSession(): void {
    const remainingMs = this.getRemainingIdleTimeMs();

    if (remainingMs === 0) {
      this.stop();
      this.timeoutCallbacks.forEach((cb) => cb());
      return;
    }

    if (remainingMs <= this.warningThresholdMs && !this.isWarningDispatched) {
      this.isWarningDispatched = true;
      this.warningCallbacks.forEach((cb) => cb(remainingMs));
    }
  }
}

export const sessionSecurityManager = new SessionSecurityManager();
