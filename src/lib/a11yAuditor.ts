/**
 * LocalFlow AI — Enterprise Accessibility (A11y) & WCAG 2.1 AA Compliance Auditor
 *
 * Implements W3C WCAG 2.1 relative luminance calculation, contrast ratio validation (4.5:1 / 3:1),
 * ARIA label presence checks, and screen reader attribute verification.
 */

export interface ContrastEvaluation {
  ratio: number;
  normalTextPassed: boolean; // >= 4.5:1
  largeTextPassed: boolean;  // >= 3.0:1
  rating: 'AAA' | 'AA' | 'FAIL';
}

/**
 * Converts a 3 or 6 digit hex color code to sRGB numbers.
 */
function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculates relative luminance for a color according to WCAG 2.1 formula.
 */
export function calculateRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes contrast ratio between two hex colors: (L1 + 0.05) / (L2 + 0.05).
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = calculateRelativeLuminance(fgHex);
  const l2 = calculateRelativeLuminance(bgHex);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Evaluates contrast ratio compliance against WCAG 2.1 AA and AAA standards.
 */
export function evaluateContrast(fgHex: string, bgHex: string): ContrastEvaluation {
  const ratio = calculateContrastRatio(fgHex, bgHex);
  const normalTextPassed = ratio >= 4.5;
  const largeTextPassed = ratio >= 3.0;

  let rating: ContrastEvaluation['rating'] = 'FAIL';
  if (ratio >= 7.0) {
    rating = 'AAA';
  } else if (normalTextPassed) {
    rating = 'AA';
  }

  return {
    ratio,
    normalTextPassed,
    largeTextPassed,
    rating,
  };
}

/**
 * Audits an interactive element (button, link, icon-button) for screen reader accessibility.
 */
export function auditElementAccessibility(props: {
  tag?: string;
  hasText?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  isIconButton?: boolean;
  altText?: string;
  isImage?: boolean;
}): { isAccessible: boolean; issues: string[] } {
  const issues: string[] = [];

  if (props.isIconButton && !props.ariaLabel && !props.ariaLabelledBy) {
    issues.push('Icon-only button missing aria-label or aria-labelledby');
  }

  if (props.isImage && props.altText === undefined) {
    issues.push('Image element missing alt attribute (empty alt="" allowed for decorative images)');
  }

  if (props.tag === 'a' && !props.hasText && !props.ariaLabel) {
    issues.push('Anchor link has no accessible name or text content');
  }

  return {
    isAccessible: issues.length === 0,
    issues,
  };
}
