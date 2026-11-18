import { describe, it, expect } from 'vitest';
import {
  DesignTokens,
  resolveSemanticStyle,
  getLayerZIndex,
} from '@/lib/designTokens';

describe('Enterprise Design System Token Registry (designTokens)', () => {
  it('exposes standard 4px grid spacing and primary color definitions', () => {
    expect(DesignTokens.spacing.sm).toBe(8);
    expect(DesignTokens.spacing.md).toBe(16);
    expect(DesignTokens.spacing.lg).toBe(24);
    expect(DesignTokens.colors.primary[600]).toBe('#4f46e5');
  });

  it('guarantees strictly ordered z-index layering hierarchy', () => {
    expect(getLayerZIndex('dropdown')).toBeLessThan(getLayerZIndex('modalBackdrop'));
    expect(getLayerZIndex('modalBackdrop')).toBeLessThan(getLayerZIndex('modal'));
    expect(getLayerZIndex('modal')).toBeLessThan(getLayerZIndex('toast'));
    expect(getLayerZIndex('toast')).toBeLessThan(getLayerZIndex('tooltip'));
  });

  it('resolves semantic role styles with dark mode variants', () => {
    const successStyle = resolveSemanticStyle('success');
    expect(successStyle.bgClass).toContain('emerald');
    expect(successStyle.textClass).toContain('emerald-700');

    const errorStyle = resolveSemanticStyle('error');
    expect(errorStyle.bgClass).toContain('red');
    expect(errorStyle.textClass).toContain('red-700');

    const neutralStyle = resolveSemanticStyle('neutral');
    expect(neutralStyle.bgClass).toContain('gray');
  });
});
