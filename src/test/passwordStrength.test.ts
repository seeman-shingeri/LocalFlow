import { describe, it, expect } from 'vitest';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';

describe('Password Strength & Complexity Evaluator (passwordStrength)', () => {
  it('flags weak passwords and predictable patterns', () => {
    const res = evaluatePasswordStrength('123456');
    expect(res.isValid).toBe(false);
    expect(res.level).toBe('weak');
    expect(res.suggestions).toContain('Use at least 8 characters.');
    expect(res.suggestions).toContain('Avoid common words or predictable patterns.');
  });

  it('evaluates strong, high-entropy passwords', () => {
    const res = evaluatePasswordStrength('Truss#Stage@2026!');
    expect(res.isValid).toBe(true);
    expect(res.score).toBe(4);
    expect(res.level).toBe('strong');
    expect(res.hasSpecialChar).toBe(true);
    expect(res.hasNumber).toBe(true);
    expect(res.hasUppercase).toBe(true);
    expect(res.suggestions).toHaveLength(0);
  });

  it('approves compliant medium strength passwords', () => {
    const res = evaluatePasswordStrength('Shamiyana12');
    expect(res.isValid).toBe(true);
    expect(res.level).toBe('good');
  });
});
