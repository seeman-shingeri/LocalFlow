import { describe, it, expect } from 'vitest';
import { resolveCategoryTheme } from '@/lib/categoryTheme';

describe('Equipment Category Icon & Color Theme Resolver (categoryTheme)', () => {
  it('resolves tents category theme accurately', () => {
    const theme = resolveCategoryTheme('tents');
    expect(theme.key).toBe('tents');
    expect(theme.label).toBe('Tents & Shamiyana');
    expect(theme.iconName).toBe('Tent');
    expect(theme.badgeBg).toContain('amber');
  });

  it('normalizes formatted and hyphenated inputs (e.g. Sound-AV)', () => {
    const theme = resolveCategoryTheme('Sound-AV');
    expect(theme.key).toBe('sound_av');
    expect(theme.label).toBe('Audio / Video & PA');
    expect(theme.iconName).toBe('Speaker');
  });

  it('provides safe fallback for undefined or custom categories', () => {
    const fallback = resolveCategoryTheme(null);
    expect(fallback.key).toBe('general');
    expect(fallback.label).toBe('General Equipment');
    expect(fallback.iconName).toBe('Box');

    const custom = resolveCategoryTheme('flower_decoration');
    expect(custom.key).toBe('flower_decoration');
    expect(custom.label).toBe('Flower_decoration');
    expect(custom.iconName).toBe('Box');
  });
});
