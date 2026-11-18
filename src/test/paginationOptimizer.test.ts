import { describe, it, expect } from 'vitest';
import {
  encodeCursor,
  decodeCursor,
  paginateByCursor,
  calculatePageWindow,
  calculatePaginationMetadata,
} from '@/lib/paginationOptimizer';

describe('Enterprise Keyset Pagination & Windowing Optimizer (paginationOptimizer)', () => {
  it('correctly encodes and decodes opaque Base64 keyset cursor', () => {
    const timestamp = '2026-11-18T10:00:00.000Z';
    const id = 'cust-12345';

    const cursor = encodeCursor(timestamp, id);
    expect(typeof cursor).toBe('string');

    const decoded = decodeCursor(cursor);
    expect(decoded).toEqual({ timestamp, id });
  });

  it('returns null on invalid cursor string', () => {
    expect(decodeCursor('not-valid-base64-json')).toBeNull();
  });

  it('paginates collection by cursor without offset scanning', () => {
    const records = [
      { id: '1', created_at: '2026-11-18T12:00:00Z', name: 'Alpha' },
      { id: '2', created_at: '2026-11-18T11:00:00Z', name: 'Beta' },
      { id: '3', created_at: '2026-11-18T10:00:00Z', name: 'Gamma' },
      { id: '4', created_at: '2026-11-18T09:00:00Z', name: 'Delta' },
    ];

    const firstPage = paginateByCursor(records, 2);
    expect(firstPage.data).toHaveLength(2);
    expect(firstPage.data[0].id).toBe('1');
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextCursor).not.toBeNull();

    // Query second page using nextCursor
    const secondPage = paginateByCursor(records, 2, firstPage.nextCursor!);
    expect(secondPage.data).toHaveLength(2);
    expect(secondPage.data[0].id).toBe('3');
    expect(secondPage.hasMore).toBe(false);
  });

  it('calculates responsive windowed page items with ellipsis', () => {
    const shortList = calculatePageWindow(1, 3);
    expect(shortList).toEqual([1, 2, 3]);

    const longListStart = calculatePageWindow(1, 10, 5);
    expect(longListStart).toEqual([1, 2, 3, 4, '...', 10]);

    const longListMiddle = calculatePageWindow(5, 10, 5);
    expect(longListMiddle).toEqual([1, '...', 4, 5, 6, '...', 10]);

    const longListEnd = calculatePageWindow(10, 10, 5);
    expect(longListEnd).toEqual([1, '...', 7, 8, 9, 10]);
  });

  it('derives accurate pagination metadata', () => {
    const meta = calculatePaginationMetadata(95, 2, 20);
    expect(meta.page).toBe(2);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
    expect(meta.startIndex).toBe(20);
    expect(meta.endIndex).toBe(40);
  });
});
