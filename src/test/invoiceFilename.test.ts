import { describe, it, expect } from 'vitest';
import {
  sanitizeFilename,
  slugifyCustomerName,
  generateInvoicePdfFilename,
} from '@/lib/invoiceFilename';

describe('Invoice PDF Filename Sanitizer & Generator (invoiceFilename)', () => {
  it('strips invalid filesystem characters and excessive underscores', () => {
    expect(sanitizeFilename('INV:2026/01*test?')).toBe('INV_2026_01_test');
    expect(sanitizeFilename('my   invoice   name')).toBe('my_invoice_name');
    expect(sanitizeFilename('')).toBe('Document');
  });

  it('slugifies customer names into clean filename slugs', () => {
    expect(slugifyCustomerName('Austin Grand Events, LLC')).toBe('Austin-Grand-Events-LLC');
    expect(slugifyCustomerName('Priya & Rohan Wedding')).toBe('Priya-Rohan-Wedding');
    expect(slugifyCustomerName(null)).toBe('Client');
  });

  it('generates a consistent, informative invoice PDF filename', () => {
    const filename = generateInvoicePdfFilename(
      'INV-2026-001',
      'Austin Grand Events',
      '2026-10-22'
    );
    expect(filename).toBe('Invoice_INV-2026-001_Austin-Grand-Events_2026-10-22.pdf');
  });

  it('handles empty inputs gracefully with fallback defaults', () => {
    const filename = generateInvoicePdfFilename('', null, null);
    expect(filename).toMatch(/^Invoice_INV_Client_\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
