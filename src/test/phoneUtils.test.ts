import { describe, it, expect } from 'vitest';
import {
  cleanDigits,
  isValidPhoneNumber,
  formatE164,
  formatNationalDisplay,
} from '@/lib/phoneUtils';

describe('Phone Number Utilities (phoneUtils)', () => {
  it('cleans non-digit characters while preserving leading plus', () => {
    expect(cleanDigits('+1 (512) 555-0199')).toBe('+15125550199');
    expect(cleanDigits('(512) 555-0199')).toBe('5125550199');
    expect(cleanDigits(null)).toBe('');
    expect(cleanDigits(undefined)).toBe('');
  });

  it('validates phone number length and plausibility', () => {
    expect(isValidPhoneNumber('5125550199')).toBe(true);
    expect(isValidPhoneNumber('+1-512-555-0199')).toBe(true);
    expect(isValidPhoneNumber('+91 98765 43210')).toBe(true);
    expect(isValidPhoneNumber('12345')).toBe(false); // too short
    expect(isValidPhoneNumber('12345678901234567')).toBe(false); // too long
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber(null)).toBe(false);
  });

  it('formats to standard E.164 string', () => {
    expect(formatE164('5125550199')).toBe('+15125550199');
    expect(formatE164('+91 98765 43210')).toBe('+919876543210');
    expect(formatE164('+15125550199')).toBe('+15125550199');
    expect(formatE164('15125550199')).toBe('+15125550199');
    expect(formatE164('')).toBe('');
  });

  it('formats 10-digit North American numbers for human display', () => {
    expect(formatNationalDisplay('5125550199')).toBe('(512) 555-0199');
    expect(formatNationalDisplay('15125550199')).toBe('+1 (512) 555-0199');
    expect(formatNationalDisplay('+44 20 7946 0912')).toBe('+44 20 7946 0912');
    expect(formatNationalDisplay(null)).toBe('—');
  });
});
