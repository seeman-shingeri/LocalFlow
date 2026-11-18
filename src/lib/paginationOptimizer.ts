/**
 * LocalFlow AI — Enterprise Keyset Pagination & Windowing Optimizer
 *
 * Implements high-performance cursor/keyset pagination for large record sets (customers, invoices, logs)
 * to avoid expensive OFFSET scans, with windowed page range generation for clean UI navigation.
 */

export interface CursorPayload {
  timestamp: string;
  id: string;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  totalReturned: number;
}

export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Encodes a composite keyset (timestamp + id) into an opaque Base64 cursor string.
 */
export function encodeCursor(timestamp: string, id: string): string {
  const payload: CursorPayload = { timestamp, id };
  const json = JSON.stringify(payload);
  return typeof btoa === 'function' ? btoa(json) : Buffer.from(json).toString('base64');
}

/**
 * Decodes an opaque Base64 cursor string back into its keyset values.
 */
export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const raw = typeof atob === 'function' ? atob(cursor) : Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'string' && typeof parsed.id === 'string') {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Slices an in-memory or cached collection using cursor keyset comparison (descending order).
 */
export function paginateByCursor<T extends { id: string; created_at: string }>(
  items: T[],
  limit: number = 20,
  cursor?: string
): CursorPaginatedResult<T> {
  let startIndex = 0;

  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      // Find the index of the cursor element
      const targetTime = new Date(decoded.timestamp).getTime();
      const cursorIndex = items.findIndex((item) => {
        const itemTime = new Date(item.created_at).getTime();
        return itemTime < targetTime || (itemTime === targetTime && item.id < decoded.id);
      });

      if (cursorIndex !== -1) {
        startIndex = cursorIndex;
      }
    }
  }

  const pageItems = items.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < items.length;

  let nextCursor: string | null = null;
  if (hasMore && pageItems.length > 0) {
    const lastItem = pageItems[pageItems.length - 1];
    nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
  }

  let prevCursor: string | null = null;
  if (startIndex > 0 && items.length > 0) {
    const firstItem = pageItems[0];
    prevCursor = encodeCursor(firstItem.created_at, firstItem.id);
  }

  return {
    data: pageItems,
    nextCursor,
    prevCursor,
    hasMore,
    totalReturned: pageItems.length,
  };
}

/**
 * Calculates responsive windowed page items (e.g., [1, 2, '...', 8, 9, 10]) for clean UI pagination.
 */
export function calculatePageWindow(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | '...')[] {
  if (totalPages <= 0) return [];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];
  const sideCount = Math.floor((maxVisible - 2) / 2);

  let start = Math.max(2, currentPage - sideCount);
  let end = Math.min(totalPages - 1, currentPage + sideCount);

  if (currentPage <= sideCount + 1) {
    end = Math.min(totalPages - 1, maxVisible - 1);
  } else if (currentPage >= totalPages - sideCount) {
    start = Math.max(2, totalPages - (maxVisible - 2));
  }

  pages.push(1);
  if (start > 2) {
    pages.push('...');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push('...');
  }
  pages.push(totalPages);

  return pages;
}

/**
 * Derives comprehensive pagination metadata for API responses and table footers.
 */
export function calculatePaginationMetadata(
  totalItems: number,
  page: number = 1,
  pageSize: number = 20
): PaginationMetadata {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (safePage - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, totalItems);

  return {
    page: safePage,
    pageSize: safePageSize,
    totalItems: Math.max(0, totalItems),
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
    startIndex,
    endIndex,
  };
}
