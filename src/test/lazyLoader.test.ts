import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  retryDynamicImport,
  preloadModule,
  prefetchAsset,
  observeViewportVisibility,
} from '@/lib/lazyLoader';

describe('Enterprise Lazy Loading & Prefetching Utility (lazyLoader)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.head.innerHTML = '';
  });

  it('successfully executes importer on first attempt', async () => {
    const mockModule = { default: () => 'Page' };
    const importer = vi.fn().mockResolvedValue(mockModule);

    const result = await retryDynamicImport(importer);
    expect(result).toBe(mockModule);
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('retries dynamic import on failure and succeeds when temporary network flakiness resolves', async () => {
    const mockModule = { default: () => 'ResolvedPage' };
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error('ChunkLoadError: Failed to fetch chunk'))
      .mockResolvedValueOnce(mockModule);

    const result = await retryDynamicImport(importer, { retries: 2, intervalMs: 10 });
    expect(result).toBe(mockModule);
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it('throws error when retries are exhausted', async () => {
    const importer = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      retryDynamicImport(importer, { retries: 1, intervalMs: 5 })
    ).rejects.toThrow('Network error');
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it('preloads modules proactively', async () => {
    const mockModule = { id: 42 };
    const importer = vi.fn().mockResolvedValue(mockModule);

    const promise = preloadModule(importer);
    const data = await promise;
    expect(data).toEqual(mockModule);
  });

  it('injects prefetch link tags and deduplicates subsequent calls', () => {
    const url = '/assets/InvoicesPage.js';
    const firstCall = prefetchAsset(url, 'script');
    expect(firstCall).toBe(true);

    const link = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
    expect(link).not.toBeNull();
    expect(link?.getAttribute('as')).toBe('script');

    // Second call should detect existing tag and not duplicate
    const secondCall = prefetchAsset(url, 'script');
    expect(secondCall).toBe(true);
    expect(document.querySelectorAll(`link[rel="prefetch"][href="${url}"]`).length).toBe(1);
  });

  it('gracefully triggers onVisible if IntersectionObserver is unavailable', () => {
    const onVisible = vi.fn();
    const div = document.createElement('div');
    const cleanup = observeViewportVisibility(div, onVisible);

    expect(onVisible).toHaveBeenCalled();
    expect(typeof cleanup).toBe('function');
  });
});
