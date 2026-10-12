import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isPast, parseISO, startOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'MMM d, yyyy');
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'MMM d, yyyy h:mm a');
  } catch {
    return String(dateStr);
  }
}

export function formatTimeOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'h:mm a');
  } catch {
    return String(dateStr);
  }
}

export function isDateOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    const today = startOfDay(new Date());
    return isPast(date) && !isToday(date);
  } catch {
    return false;
  }
}

export function isDateToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    return isToday(date);
  } catch {
    return false;
  }
}

export function calculateInvoiceTotals(
  items: Array<{ quantity: number; unit_price: number }>,
  taxRate: number = 0
) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const taxAmount = Math.round((roundedSubtotal * (taxRate / 100)) * 100) / 100;
  const totalAmount = Math.round((roundedSubtotal + taxAmount) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    taxAmount,
    totalAmount,
  };
}

export function buildCsvString(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): string {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    // Prevent CSV formula injection in spreadsheet apps
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const bodyLines = rows.map((row) => row.map(escapeCell).join(','));
  return [headerLine, ...bodyLines].join('\r\n');
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): void {
  const csvContent = buildCsvString(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

