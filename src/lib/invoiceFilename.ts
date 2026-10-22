/**
 * Sanitizes a string removing characters forbidden in Windows/POSIX filenames.
 */
export function sanitizeFilename(input: string): string {
  if (!input) return 'Document';
  return input
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .trim() || 'Document';
}

/**
 * Creates a slug from customer name suitable for clean filenames.
 */
export function slugifyCustomerName(name: string | null | undefined): string {
  if (!name) return 'Client';
  const clean = name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  return clean || 'Client';
}

/**
 * Generates standard, cross-platform PDF filenames for invoices.
 * Example: "Invoice_INV-2026-001_Austin-Events_2026-10-22.pdf"
 */
export function generateInvoicePdfFilename(
  invoiceNumber: string,
  customerName?: string | null,
  issueDate?: string | null
): string {
  const cleanInvNum = sanitizeFilename(invoiceNumber || 'INV');
  const cleanClient = slugifyCustomerName(customerName);
  const dateStr = issueDate ? issueDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

  return `Invoice_${cleanInvNum}_${cleanClient}_${dateStr}.pdf`;
}
