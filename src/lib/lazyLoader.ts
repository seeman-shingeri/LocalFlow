/**
 * LocalFlow AI — Enterprise Component & Resource Lazy Loading Utility
 *
 * Provides resilient chunk-failure retrying, programmatic prefetching,
 * and intersection-based deferred component rendering to optimize Core Web Vitals.
 */

export interface RetryLazyOptions {
  retries?: number;
  intervalMs?: number;
}

/**
 * Wraps dynamic dynamic imports with automatic retry logic to withstand
 * transient CDN interruptions or deployment chunk hash invalidations.
 */
export async function retryDynamicImport<T>(
  importer: () => Promise<T>,
  options: RetryLazyOptions = {}
): Promise<T> {
  const { retries = 2, intervalMs = 400 } = options;
  let attempt = 0;

  while (true) {
    try {
      return await importer();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs * attempt));
    }
  }
}

/**
 * Preloads a component or module into browser cache before the user clicks.
 */
export function preloadModule<T>(importer: () => Promise<T>): Promise<T> {
  return importer();
}

/**
 * Programmatically injects a <link rel="prefetch"> tag into document.head
 * to warm up the browser cache for upcoming routes or assets.
 */
export function prefetchAsset(
  url: string,
  asType: 'script' | 'style' | 'image' | 'font' | 'fetch' = 'fetch'
): boolean {
  if (typeof document === 'undefined') return false;

  // Prevent duplicate prefetch links
  const existing = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
  if (existing) return true;

  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.setAttribute('as', asType);
    if (asType === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
    return true;
  } catch {
    return false;
  }
}

/**
 * Simple viewport observer helper that triggers once an element enters the viewport.
 * Returns an unobserve cleanup function.
 */
export function observeViewportVisibility(
  element: HTMLElement | null,
  onVisible: () => void,
  options?: IntersectionObserverInit
): () => void {
  if (!element || typeof IntersectionObserver === 'undefined') {
    // If IntersectionObserver is unsupported, execute immediately
    onVisible();
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        onVisible();
        observer.unobserve(entry.target);
        break;
      }
    }
  }, options);

  observer.observe(element);
  return () => observer.disconnect();
}
