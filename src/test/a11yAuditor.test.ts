import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  evaluateContrast,
  auditElementAccessibility,
} from '@/lib/a11yAuditor';

describe('Enterprise Accessibility & WCAG 2.1 AA Compliance Auditor (a11yAuditor)', () => {
  it('calculates maximum contrast ratio (21:1) between pure black and white', () => {
    const ratio = calculateContrastRatio('#000000', '#ffffff');
    expect(ratio).toBe(21);
  });

  it('evaluates compliant AA contrast for high-contrast combinations', () => {
    // Dark gray text on white background
    const evalResult = evaluateContrast('#1f2937', '#ffffff');
    expect(evalResult.normalTextPassed).toBe(true);
    expect(evalResult.largeTextPassed).toBe(true);
    expect(evalResult.ratio).toBeGreaterThanOrEqual(4.5);
    expect(['AA', 'AAA']).toContain(evalResult.rating);
  });

  it('flags failing contrast for low-contrast text', () => {
    // Light gray on white
    const evalResult = evaluateContrast('#d1d5db', '#ffffff');
    expect(evalResult.normalTextPassed).toBe(false);
    expect(evalResult.rating).toBe('FAIL');
  });

  it('audits icon buttons and flags missing accessible labels', () => {
    const missingLabel = auditElementAccessibility({
      tag: 'button',
      isIconButton: true,
    });
    expect(missingLabel.isAccessible).toBe(false);
    expect(missingLabel.issues[0]).toContain('missing aria-label');

    const withLabel = auditElementAccessibility({
      tag: 'button',
      isIconButton: true,
      ariaLabel: 'Close drawer',
    });
    expect(withLabel.isAccessible).toBe(true);
    expect(withLabel.issues).toHaveLength(0);
  });

  it('audits images and verifies alt attribute presence', () => {
    const missingAlt = auditElementAccessibility({ isImage: true });
    expect(missingAlt.isAccessible).toBe(false);

    const validAlt = auditElementAccessibility({ isImage: true, altText: 'Company Logo' });
    expect(validAlt.isAccessible).toBe(true);
  });
});
