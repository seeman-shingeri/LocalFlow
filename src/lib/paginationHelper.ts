export interface PaginationParams {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number; // 1-based display index
  endIndex: number;   // 1-based display index
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  pageNumbers: (number | string)[];
}

/**
 * Generates an array of page numbers with ellipsis for rendering clean pagination controls.
 */
export function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | string)[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const sideCount = Math.floor((maxVisible - 2) / 2);

  let start = Math.max(2, currentPage - sideCount);
  let end = Math.min(totalPages - 1, currentPage + sideCount);

  if (currentPage - sideCount <= 2) {
    end = 2 + (maxVisible - 3);
  } else if (currentPage + sideCount >= totalPages - 1) {
    start = totalPages - 1 - (maxVisible - 3);
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
 * Slices any item array safely with clamped page bounds and metadata.
 */
export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number = 10
): PaginationResult<T> {
  const safePageSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));

  // Clamping page within 1 and totalPages
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const zeroBasedStart = (currentPage - 1) * safePageSize;
  const zeroBasedEnd = Math.min(zeroBasedStart + safePageSize, totalItems);

  const paginatedSlice = totalItems > 0 ? items.slice(zeroBasedStart, zeroBasedEnd) : [];

  return {
    items: paginatedSlice,
    currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startIndex: totalItems > 0 ? zeroBasedStart + 1 : 0,
    endIndex: zeroBasedEnd,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
    pageNumbers: generatePaginationRange(currentPage, totalPages),
  };
}
