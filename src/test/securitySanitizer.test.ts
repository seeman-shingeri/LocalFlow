import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtmlTags,
  sanitizeUrl,
  sanitizeFilename,
  stripControlCharacters,
  sanitizeText,
} from '@/lib/securitySanitizer';

describe('Enterprise Input Sanitization & Injection Guard (securitySanitizer)', () => {
  it('encodes unsafe HTML characters to prevent XSS', () => {
    const malicious = '<script>alert("XSS")</script>&foo=\'bar\'';
    const escaped = escapeHtml(malicious);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;&amp;foo=&#x27;bar&#x27;');
  });

  it('strips HTML tags completely while retaining inner text', () => {
    const html = '<p>Hello <strong>World</strong> <a href="#">Link</a></p>';
    expect(stripHtmlTags(html)).toBe('Hello World Link');
  });

  it('sanitizes URLs, blocking dangerous pseudo-protocols like javascript: and data:', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('about:blank');
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('about:blank');
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('about:blank');

    // Safe protocols
    expect(sanitizeUrl('https://example.com/invoice/123')).toBe('https://example.com/invoice/123');
    expect(sanitizeUrl('mailto:client@example.com')).toBe('mailto:client@example.com');
    expect(sanitizeUrl('tel:+919876543210')).toBe('tel:+919876543210');
    expect(sanitizeUrl('/invoices/view/42')).toBe('/invoices/view/42');
  });

  it('sanitizes filenames and eliminates path traversal attempts', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('invoice/..\\report:2026.pdf')).toBe('report_2026.pdf');
    expect(sanitizeFilename('normal-file_name.csv')).toBe('normal-file_name.csv');
    expect(sanitizeFilename('')).toBe('unnamed');
  });

  it('strips non-printable ASCII control characters', () => {
    const withNullByte = 'Client\x00Name\x07Alert';
    expect(stripControlCharacters(withNullByte)).toBe('ClientNameAlert');
  });

  it('combines text cleaning safely in sanitizeText', () => {
    const input = '   <b>VIP Client</b>\x00 with notes   ';
    expect(sanitizeText(input)).toBe('VIP Client with notes');
  });
});
