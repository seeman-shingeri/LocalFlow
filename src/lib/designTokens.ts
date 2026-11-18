/**
 * LocalFlow AI — Enterprise Design System Token Registry
 *
 * Provides a single source of truth for semantic color palettes, typography scales,
 * 4px-grid spacing, elevations (shadows), and deterministic z-index layering.
 */

export const DesignTokens = {
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      400: '#9ca3af',
      600: '#4b5563',
      800: '#1f2937',
      900: '#111827',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    drawerBackdrop: 1040,
    drawer: 1050,
    modalBackdrop: 1060,
    modal: 1070,
    toast: 1080,
    tooltip: 1090,
  },

  radii: {
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    full: '9999px',
  },
} as const;

export type SemanticRole = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export interface SemanticBadgeStyle {
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/**
 * Resolves standard Tailwind badge and banner classes for a semantic role.
 */
export function resolveSemanticStyle(role: SemanticRole): SemanticBadgeStyle {
  switch (role) {
    case 'primary':
      return {
        bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
        textClass: 'text-indigo-700 dark:text-indigo-300',
        borderClass: 'border-indigo-200 dark:border-indigo-800',
      };
    case 'success':
      return {
        bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        borderClass: 'border-emerald-200 dark:border-emerald-800',
      };
    case 'warning':
      return {
        bgClass: 'bg-amber-50 dark:bg-amber-950/40',
        textClass: 'text-amber-700 dark:text-amber-300',
        borderClass: 'border-amber-200 dark:border-amber-800',
      };
    case 'error':
      return {
        bgClass: 'bg-red-50 dark:bg-red-950/40',
        textClass: 'text-red-700 dark:text-red-300',
        borderClass: 'border-red-200 dark:border-red-800',
      };
    default:
      return {
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-700 dark:text-gray-300',
        borderClass: 'border-gray-200 dark:border-gray-700',
      };
  }
}

/**
 * Returns safe layered z-index number for stacking context management.
 */
export function getLayerZIndex(layer: keyof typeof DesignTokens.zIndex): number {
  return DesignTokens.zIndex[layer] ?? 0;
}
