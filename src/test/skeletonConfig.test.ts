import { describe, it, expect } from 'vitest';
import {
  buildTableSkeletonSpec,
  buildCardSkeletonSpec,
  getSkeletonShimmerClasses,
} from '@/lib/skeletonConfig';

describe('Enterprise Graceful Loading States & Skeleton Configurator (skeletonConfig)', () => {
  it('generates table skeleton specifications with typed column blueprints', () => {
    const spec = buildTableSkeletonSpec(['25%', '35%', '15%', '25%'], 6, 52);

    expect(spec.rowCount).toBe(6);
    expect(spec.rowHeightPx).toBe(52);
    expect(spec.columns).toHaveLength(4);
    expect(spec.columns[0].type).toBe('avatar');
    expect(spec.columns[2].type).toBe('badge');
    expect(spec.columns[3].type).toBe('action');
  });

  it('clamps table row count within safe visual boundaries', () => {
    const minClamped = buildTableSkeletonSpec(['50%', '50%'], 0);
    expect(minClamped.rowCount).toBe(1);

    const maxClamped = buildTableSkeletonSpec(['50%', '50%'], 100);
    expect(maxClamped.rowCount).toBe(20);
  });

  it('generates card skeleton specifications', () => {
    const cardSpec = buildCardSkeletonSpec(8, 160, true, true);
    expect(cardSpec.cardCount).toBe(8);
    expect(cardSpec.cardHeightPx).toBe(160);
    expect(cardSpec.hasHeader).toBe(true);
    expect(cardSpec.hasFooter).toBe(true);
  });

  it('returns valid Tailwind CSS shimmer classes based on animation mode', () => {
    expect(getSkeletonShimmerClasses('pulse')).toContain('animate-pulse');
    expect(getSkeletonShimmerClasses('wave')).toContain('before:animate-[shimmer_2s_infinite]');
    expect(getSkeletonShimmerClasses('none')).not.toContain('animate-pulse');
  });
});
