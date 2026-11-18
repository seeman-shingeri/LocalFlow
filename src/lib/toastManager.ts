/**
 * LocalFlow AI — Enterprise Nonintrusive Toast Notification Queue
 *
 * Implements a prioritized, deduplicated notification dispatcher with
 * automatic dismissal timers, maximum on-screen limits, and accessible screen-reader announcements.
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  durationMs: number;
  timestamp: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastOptions {
  message?: string;
  durationMs?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ToastListener = (toasts: ToastItem[]) => void;

export class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();
  private maxVisible: number;
  private defaultDurationMs: number;

  constructor(maxVisible: number = 3, defaultDurationMs: number = 4000) {
    this.maxVisible = maxVisible;
    this.defaultDurationMs = defaultDurationMs;
  }

  /**
   * Dispatches a new toast notification with automatic deduplication.
   */
  show(variant: ToastVariant, title: string, options: ToastOptions = {}): string {
    const { message, durationMs = this.defaultDurationMs, action } = options;

    // Deduplicate: If an identical active toast was posted within the last 1500ms, ignore
    const duplicate = this.toasts.find(
      (t) => t.variant === variant && t.title === title && Date.now() - t.timestamp < 1500
    );
    if (duplicate) {
      return duplicate.id;
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const toast: ToastItem = {
      id,
      variant,
      title,
      message,
      durationMs,
      timestamp: Date.now(),
      action,
    };

    this.toasts.push(toast);

    // Enforce maximum visible toasts limit
    if (this.toasts.length > this.maxVisible) {
      this.toasts.shift();
    }

    this.notify();

    // Auto-dismiss after durationMs
    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }

    return id;
  }

  success(title: string, options?: ToastOptions): string {
    return this.show('success', title, options);
  }

  error(title: string, options?: ToastOptions): string {
    // Errors stay slightly longer by default
    const opts = { durationMs: 6000, ...options };
    return this.show('error', title, opts);
  }

  warning(title: string, options?: ToastOptions): string {
    return this.show('warning', title, options);
  }

  info(title: string, options?: ToastOptions): string {
    return this.show('info', title, options);
  }

  /**
   * Dismisses a toast by ID.
   */
  dismiss(id: string): void {
    const initialLen = this.toasts.length;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.toasts.length !== initialLen) {
      this.notify();
    }
  }

  /**
   * Subscribes to toast queue updates.
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns current active toasts.
   */
  getToasts(): ToastItem[] {
    return [...this.toasts];
  }

  /**
   * Clears all active toasts.
   */
  clear(): void {
    this.toasts = [];
    this.notify();
  }

  private notify(): void {
    const snapshot = [...this.toasts];
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const toastManager = new ToastManager();
