import { describe, it, expect } from 'vitest';
import { paginateItems, generatePaginationRange } from '@/lib/paginationHelper';

describe('Paginated Array Slicer & Total Pages Helper (paginationHelper)', () => {
  const mockItems = Array.from({ length: 45 }, (_, i) => `Item ${i + 1}`);

  it('paginates the first page correctly', () => {
    const res = paginateItems(mockItems, 1, 10);

    expect(res.currentPage).toBe(1);
    expect(res.totalPages).toBe(5);
    expect(res.totalItems).toBe(45);
    expect(res.startIndex).toBe(1);
    expect(res.endIndex).toBe(10);
    expect(res.hasPreviousPage).toBe(false);
    expect(res.hasNextPage).toBe(true);
    expect(res.items.length).toBe(10);
    expect(res.items[0]).toBe('Item 1');
    expect(res.items[9]).toBe('Item 10');
  });

  it('clamps out-of-range page requests safely', () => {
    // Requesting page 99 when only 5 pages exist should clamp to page 5
    const res = paginateItems(mockItems, 99, 10);

    expect(res.currentPage).toBe(5);
    expect(res.items.length).toBe(5); // items 41 to 45
    expect(res.startIndex).toBe(41);
    expect(res.endIndex).toBe(45);
    expect(res.hasNextPage).toBe(false);
    expect(res.hasPreviousPage).toBe(true);
  });

  it('handles empty lists gracefully', () => {
    const res = paginateItems([], 1, 10);

    expect(res.totalItems).toBe(0);
    expect(res.totalPages).toBe(1);
    expect(res.currentPage).toBe(1);
    expect(res.items).toHaveLength(0);
    expect(res.startIndex).toBe(0);
    expect(res.endIndex).toBe(0);
  });

  it('generates proper page range with ellipses for large page counts', () => {
    const rangeMiddle = generatePaginationRange(5, 10, 5);
    expect(rangeMiddle).toEqual([1, '...', 4, 5, 6, '...', 10]);

    const rangeStart = generatePaginationRange(1, 10, 5);
    expect(rangeStart).toEqual([1, 2, 3, 4, '...', 10]);
  });
});
