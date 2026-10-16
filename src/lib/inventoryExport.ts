import { InventoryItem } from '@/types/database';

/**
 * Escapes a cell value for standard RFC 4180 CSV format.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates RFC 4180 compliant CSV string from an array of inventory items.
 */
export function generateInventoryCsv(items: InventoryItem[]): string {
  const headers = [
    'SKU',
    'Item Name',
    'Category',
    'Total Units',
    'Available Units',
    'Reserved Units',
    'Min Stock Level',
    'Daily Rental Rate',
    'Unit',
    'Stock Status',
    'Location',
    'Daily Revenue Potential',
    'Active Daily Revenue',
  ];

  const rows = items.map((item) => {
    const isOutOfStock = Number(item.available_quantity) === 0;
    const isLowStock = Number(item.available_quantity) <= Number(item.min_stock_level);
    const stockStatus = isOutOfStock
      ? 'Out of Stock'
      : isLowStock
      ? 'Low Stock Alert'
      : 'Healthy';

    const dailyPotential = (Number(item.total_quantity) || 0) * (Number(item.rental_rate_per_day) || 0);
    const activeDaily = (Number(item.reserved_quantity) || 0) * (Number(item.rental_rate_per_day) || 0);

    return [
      escapeCsvValue(item.sku),
      escapeCsvValue(item.name),
      escapeCsvValue(item.category),
      item.total_quantity,
      item.available_quantity,
      item.reserved_quantity,
      item.min_stock_level,
      (Number(item.rental_rate_per_day) || 0).toFixed(2),
      escapeCsvValue(item.unit || 'units'),
      escapeCsvValue(stockStatus),
      escapeCsvValue(item.location || 'N/A'),
      dailyPotential.toFixed(2),
      activeDaily.toFixed(2),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers browser download of inventory CSV.
 */
export function downloadInventoryCsv(
  items: InventoryItem[],
  filename: string = `inventory-fleet-export-${new Date().toISOString().slice(0, 10)}.csv`
): void {
  const csvContent = generateInventoryCsv(items);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
