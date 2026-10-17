/**
 * Utility for phone number cleansing, E.164 formatting, and validation.
 */

export function cleanDigits(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '').trim();
}

/**
 * Validates whether a phone string contains a plausible 7 to 15 digit telephone number.
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Formats a phone string into international E.164 format (+[country][digits]).
 * Defaults to country code +1 (US/CA) if no leading plus or country code is detected.
 */
export function formatE164(
  phone: string | null | undefined,
  defaultCountryCode: string = '1'
): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, '');

  if (digitsOnly.length === 0) return '';

  if (trimmed.startsWith('+')) {
    return `+${digitsOnly}`;
  }

  // If 10 digits (standard North American number without 1), prepend default country code
  if (digitsOnly.length === 10) {
    return `+${defaultCountryCode}${digitsOnly}`;
  }

  // If already starts with country code (e.g. 11 digits starting with 1)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

/**
 * Formats a 10-digit North American number as (XXX) XXX-XXXX for clean UI display.
 */
export function formatNationalDisplay(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/[^\d]/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    const d = digits.slice(1);
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  return phone;
}
