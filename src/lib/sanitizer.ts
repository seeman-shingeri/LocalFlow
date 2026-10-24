/**
 * Strips script tags, HTML elements, and dangerous URI schemes.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove script and style tags and their inner content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove inline javascript: pseudos
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Neutralizes potential CSV/Excel injection vulnerability characters.
 */
export function sanitizeForSpreadsheet(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];

  if (dangerousPrefixes.some((p) => trimmed.startsWith(p))) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Universal text field input cleaner: strips HTML, limits length, and collapses multiple whitespace.
 */
export function cleanUserInput(
  rawInput: string | null | undefined,
  maxLength: number = 500
): string {
  if (!rawInput || typeof rawInput !== 'string') return '';

  const withoutHtml = sanitizeHtml(rawInput);
  const normalizedSpaces = withoutHtml.replace(/\s+/g, ' ');
  return normalizedSpaces.slice(0, maxLength);
}
