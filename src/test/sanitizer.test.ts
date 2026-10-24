import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeForSpreadsheet, cleanUserInput } from '@/lib/sanitizer';

describe('Data Sanitizer & XSS Stripper (sanitizer)', () => {
  it('strips script tags and inner malicious code', () => {
    const malicious = 'Hello <script>alert("hacked")</script> World';
    expect(sanitizeHtml(malicious)).toBe('Hello  World');
  });

  it('strips embedded html elements and attributes', () => {
    const html = '<b onclick="malicious()">Bold</b> Text <img src=x onerror=alert(1)>';
    expect(sanitizeHtml(html)).toBe('Bold Text');
  });

  it('neutralizes spreadsheet formula injection prefixes', () => {
    expect(sanitizeForSpreadsheet('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeForSpreadsheet('+cmd|/C calc!A0')).toBe("'+cmd|/C calc!A0");
    expect(sanitizeForSpreadsheet('Regular text')).toBe('Regular text');
  });

  it('cleans user input with space normalization and max length clamping', () => {
    const input = '   Grand   Wedding   <b>Ceremony</b>   ';
    const cleaned = cleanUserInput(input, 15);
    expect(cleaned).toBe('Grand Wedding C');
  });
});
