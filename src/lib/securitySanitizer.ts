/**
 * LocalFlow AI — Enterprise Input Sanitization & Injection Guard
 *
 * Implements OWASP-compliant string and URL sanitization:
 * HTML entity encoding, tag stripping, malicious URI scheme disallowance,
 * path traversal protection, and ASCII control character removal.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
};

/**
 * Encodes dangerous characters to their corresponding HTML entities.
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[&<>"'`/]/g, (match) => HTML_ENTITY_MAP[match] || match);
}

/**
 * Strips all HTML tags from an input string while preserving inner text content.
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/<\/?[^>]+(>|$)/gi, '');
}

/**
 * Validates and sanitizes a URL, allowing only safe protocols (http, https, mailto, tel).
 * Blocks dangerous pseudo-protocols like javascript:, data:, and vbscript:.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Disallow javascript:, vbscript:, and inline data: schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return 'about:blank';
  }

  // Allow relative URLs starting with /
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  // Check valid protocols
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  try {
    const parsed = new URL(trimmed);
    if (!safeProtocols.includes(parsed.protocol)) {
      return 'about:blank';
    }
    return trimmed;
  } catch {
    // If not a valid absolute URL, sanitize relative fragment
    return trimmed.replace(/[^\w\d\-._~:/?#[\]@!$&'()*+,;=]/gi, '');
  }
}

/**
 * Sanitizes file names to prevent directory traversal attacks (../) and illegal OS characters.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'unnamed';

  // Extract base filename to eliminate any directory path components
  const base = filename.split(/[/\\]/).pop() || '';

  return (
    base
      .replace(/\.\.+/g, '') // Remove .. directory traversal
      .replace(/[/\\]/g, '') // Remove remaining slashes
      .replace(/[<>:"|?*]/g, '_') // Replace illegal file characters
      .trim() || 'unnamed'
  );
}

/**
 * Strips non-printable ASCII control characters (0x00 - 0x1F and 0x7F) except standard whitespace.
 */
export function stripControlCharacters(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Keep tab (\t), newline (\n), carriage return (\r)
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Standard text cleaner combining control char removal and tag stripping.
 */
export function sanitizeText(input: string): string {
  return stripControlCharacters(stripHtmlTags(input)).trim();
}
