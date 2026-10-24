export interface CategoryTheme {
  key: string;
  label: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const KNOWN_THEMES: Record<string, CategoryTheme> = {
  tents: {
    key: 'tents',
    label: 'Tents & Shamiyana',
    iconName: 'Tent',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
  },
  furniture: {
    key: 'furniture',
    label: 'Furniture & Seating',
    iconName: 'Armchair',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
  },
  lighting: {
    key: 'lighting',
    label: 'Lighting & Trussing',
    iconName: 'Lightbulb',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
    badgeBorder: 'border-yellow-200 dark:border-yellow-800',
  },
  sound_av: {
    key: 'sound_av',
    label: 'Audio / Video & PA',
    iconName: 'Speaker',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
  },
  stages: {
    key: 'stages',
    label: 'Stages & Platforms',
    iconName: 'Layers',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
  },
  crockery: {
    key: 'crockery',
    label: 'Catering & Crockery',
    iconName: 'Utensils',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
  },
  generators: {
    key: 'generators',
    label: 'Power & Generators',
    iconName: 'Zap',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
  },
};

const DEFAULT_THEME: CategoryTheme = {
  key: 'general',
  label: 'General Equipment',
  iconName: 'Box',
  badgeBg: 'bg-slate-50 dark:bg-slate-900',
  badgeText: 'text-slate-700 dark:text-slate-300',
  badgeBorder: 'border-slate-200 dark:border-slate-800',
};

/**
 * Resolves icon and color themes for inventory categories with fallback.
 */
export function resolveCategoryTheme(categoryKey?: string | null): CategoryTheme {
  if (!categoryKey) return DEFAULT_THEME;

  const normalized = categoryKey
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_');

  return KNOWN_THEMES[normalized] || {
    ...DEFAULT_THEME,
    key: normalized,
    label: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
  };
}
