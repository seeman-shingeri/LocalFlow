/**
 * LocalFlow AI — Enterprise Graceful Loading States & Skeleton Layout Configurator
 *
 * Computes deterministic placeholder layouts, skeleton table specifications,
 * and Cumulative Layout Shift (CLS) reserving dimensions for asynchronous views.
 */

export interface SkeletonColumn {
  width: string;
  type: 'text' | 'badge' | 'avatar' | 'action';
}

export interface TableSkeletonSpec {
  rowCount: number;
  columns: SkeletonColumn[];
  rowHeightPx: number;
}

export interface CardSkeletonSpec {
  cardCount: number;
  cardHeightPx: number;
  hasHeader: boolean;
  hasFooter: boolean;
}

/**
 * Builds table skeleton blueprint specifying column widths and component placeholder types.
 */
export function buildTableSkeletonSpec(
  columnWidths: string[] = ['20%', '30%', '20%', '15%', '15%'],
  rowCount: number = 5,
  rowHeightPx: number = 48
): TableSkeletonSpec {
  const columns: SkeletonColumn[] = columnWidths.map((width, idx) => {
    let type: SkeletonColumn['type'] = 'text';
    if (idx === 0) type = 'avatar';
    else if (idx === columnWidths.length - 1) type = 'action';
    else if (width.includes('10%') || width.includes('15%')) type = 'badge';

    return { width, type };
  });

  return {
    rowCount: Math.max(1, Math.min(rowCount, 20)),
    columns,
    rowHeightPx,
  };
}

/**
 * Builds card grid skeleton blueprint for metric cards or Kanban boards.
 */
export function buildCardSkeletonSpec(
  count: number = 4,
  cardHeightPx: number = 140,
  hasHeader: boolean = true,
  hasFooter: boolean = false
): CardSkeletonSpec {
  return {
    cardCount: Math.max(1, count),
    cardHeightPx,
    hasHeader,
    hasFooter,
  };
}

/**
 * Derives CSS class strings and animation styling for consistent shimmer effects.
 */
export function getSkeletonShimmerClasses(animation: 'pulse' | 'wave' | 'none' = 'pulse'): string {
  const base = 'bg-gray-200 dark:bg-gray-700 rounded';
  switch (animation) {
    case 'pulse':
      return `${base} animate-pulse`;
    case 'wave':
      return `${base} overflow-hidden relative before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent`;
    default:
      return base;
  }
}
