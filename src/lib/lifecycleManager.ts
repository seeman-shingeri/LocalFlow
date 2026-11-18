/**
 * LocalFlow AI — Enterprise Component Lifecycle & Memory Leak Prevention Utility
 *
 * Tracks, manages, and guarantees safe deterministic cleanup of DOM listeners,
 * intervals, timeouts, AbortControllers, and async subscriptions to prevent memory leaks in SPAs.
 */

export type DisposerFunction = () => void | Promise<void>;

export class LifecycleManager {
  private disposers: Set<DisposerFunction> = new Set();
  private abortControllers: Set<AbortController> = new Set();
  private disposed: boolean = false;

  /**
   * Registers a custom disposal function. Returns a function to unregister and run it early.
   */
  add(disposer: DisposerFunction): () => void {
    if (this.disposed) {
      // If already disposed, execute immediately
      try {
        const result = disposer();
        if (result instanceof Promise) result.catch(() => {});
      } catch {}
      return () => {};
    }

    this.disposers.add(disposer);
    return () => {
      if (this.disposers.has(disposer)) {
        this.disposers.delete(disposer);
        try {
          const result = disposer();
          if (result instanceof Promise) result.catch(() => {});
        } catch {}
      }
    };
  }

  /**
   * Attaches a DOM event listener that will be automatically removed on cleanup.
   */
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    target.addEventListener(type, listener, options);
    const remove = () => target.removeEventListener(type, listener, options);
    return this.add(remove);
  }

  /**
   * Creates a self-cleaning interval timer.
   */
  setInterval(callback: () => void, ms: number): () => void {
    const id = setInterval(callback, ms);
    return this.add(() => clearInterval(id));
  }

  /**
   * Creates a self-cleaning timeout timer.
   */
  setTimeout(callback: () => void, ms: number): () => void {
    const id = setTimeout(callback, ms);
    return this.add(() => clearTimeout(id));
  }

  /**
   * Creates an AbortController whose .abort() will automatically fire on cleanup.
   */
  createAbortController(): AbortController {
    const controller = new AbortController();
    if (this.disposed) {
      controller.abort();
      return controller;
    }

    this.abortControllers.add(controller);
    this.add(() => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
      this.abortControllers.delete(controller);
    });

    return controller;
  }

  /**
   * Executes all registered disposers and aborts all active controllers.
   */
  async disposeAll(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    // Abort in-flight network requests
    for (const controller of this.abortControllers) {
      if (!controller.signal.aborted) {
        try {
          controller.abort();
        } catch {}
      }
    }
    this.abortControllers.clear();

    // Run disposers
    const promises: Promise<void>[] = [];
    for (const disposer of this.disposers) {
      try {
        const result = disposer();
        if (result instanceof Promise) {
          promises.push(result.catch(() => {}));
        }
      } catch {}
    }

    this.disposers.clear();
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Returns the count of currently registered active disposers.
   */
  count(): number {
    return this.disposers.size;
  }

  /**
   * Checks if this lifecycle manager has been disposed.
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}

/**
 * Creates a scoped lifecycle manager instance.
 */
export function createLifecycle(): LifecycleManager {
  return new LifecycleManager();
}
