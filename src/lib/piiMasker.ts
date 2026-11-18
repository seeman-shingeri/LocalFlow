/**
 * LocalFlow AI — Enterprise Sensitive Data Protection & PII Masking Engine
 *
 * Automatically redacts Personally Identifiable Information (PII) including email addresses,
 * phone numbers, credit card numbers, authorization tokens, and credentials from logs and telemetry.
 */

const DEFAULT_SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'bearer',
  'creditcard',
  'cardnumber',
  'cvv',
  'cvc',
  'ssn',
  'pan',
  'upi_pin',
]);

/**
 * Masks an email address preserving first two characters and domain (e.g. pr***@domain.com).
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED_EMAIL]';

  const [username, domain] = parts;
  if (username.length <= 2) {
    return `${username[0] || '*'}***@${domain}`;
  }
  return `${username.substring(0, 2)}***@${domain}`;
}

/**
 * Masks phone numbers showing only country code and the last 3-4 digits.
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '[REDACTED_PHONE]';

  const last4 = digits.slice(-4);
  const leading = digits.slice(0, 2);
  return `+${leading} **** ***${last4}`;
}

/**
 * Masks credit card or bank account numbers showing only the last 4 digits.
 */
export function maskCreditCard(card: string): string {
  if (!card || typeof card !== 'string') return '';
  const digits = card.replace(/\D/g, '');
  if (digits.length < 8) return '[REDACTED_CARD]';

  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Redacts JWT tokens or private API keys.
 */
export function maskSecret(secret: string): string {
  if (!secret || typeof secret !== 'string') return '';
  if (secret.length < 8) return '[REDACTED]';
  return `${secret.substring(0, 4)}...[REDACTED]`;
}

/**
 * Recursively scans and redacts sensitive keys or values within objects and arrays.
 */
export function sanitizeObjectPII<T>(input: T, customSensitiveKeys: string[] = []): T {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'object') return input;

  const sensitiveSet = new Set([
    ...DEFAULT_SENSITIVE_KEYS,
    ...customSensitiveKeys.map((k) => k.toLowerCase()),
  ]);

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObjectPII(item, customSensitiveKeys)) as unknown as T;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(input)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');

    if (sensitiveSet.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      if (lowerKey.includes('email')) {
        result[key] = maskEmail(value);
      } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
        result[key] = maskPhone(value);
      } else {
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObjectPII(value, customSensitiveKeys);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
