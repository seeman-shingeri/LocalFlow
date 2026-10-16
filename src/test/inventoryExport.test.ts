import { describe, it, expect } from 'vitest';
import { generateInventoryCsv } from '@/lib/inventoryExport';
import { InventoryItem } from '@/types/database';

describe('Inventory CSV Export Utility', () => {
  const sampleItems: InventoryItem[] = [
    {
      id: 'inv-001',
      workspace_id: 'ws-1',
      name: 'Waterproof Shamiyana Marquee (40x60 ft)',
      category: 'Shamiyana & Tents',
      sku: 'SHAM-TNT-4060',
      total_quantity: 10,
      available_quantity: 2,
      reserved_quantity: 8,
      min_stock_level: 4,
      rental_rate_per_day: 350.0,
      unit: 'units',
      location: 'Main Warehouse Bay A-1',
      notes: 'High demand for weddings',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    },
    {
      id: 'inv-002',
      workspace_id: 'ws-1',
      name: 'Warm LED Fairy String Lights, 100m Reel',
      category: 'Lighting & Electrical',
      sku: 'LIGHT-STR-100',
      total_quantity: 40,
      available_quantity: 0,
      reserved_quantity: 40,
      min_stock_level: 8,
      rental_rate_per_day: 45.0,
      unit: 'sets',
      location: 'Electrical Cage 2',
      notes: null,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    },
    {
      id: 'inv-003',
      workspace_id: 'ws-1',
      name: 'Deluxe Banquet Chairs',
      category: 'Seating & Tables',
      sku: 'SEAT-CHR-01',
      total_quantity: 200,
      available_quantity: 150,
      reserved_quantity: 50,
      min_stock_level: 30,
      rental_rate_per_day: 3.5,
      unit: 'units',
      location: null,
      notes: null,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    },
  ];

  it('generates standard CSV headers', () => {
    const csv = generateInventoryCsv(sampleItems);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(
      'SKU,Item Name,Category,Total Units,Available Units,Reserved Units,Min Stock Level,Daily Rental Rate,Unit,Stock Status,Location,Daily Revenue Potential,Active Daily Revenue'
    );
  });

  it('formats item rows with correct calculated stock status and revenue', () => {
    const csv = generateInventoryCsv(sampleItems);
    const lines = csv.split('\r\n');

    // Row 1: Low stock alert (2 <= 4)
    expect(lines[1]).toContain('"SHAM-TNT-4060"');
    expect(lines[1]).toContain('"Waterproof Shamiyana Marquee (40x60 ft)"');
    expect(lines[1]).toContain('"Low Stock Alert"');
    expect(lines[1]).toContain('3500.00'); // total potential: 10 * 350
    expect(lines[1]).toContain('2800.00'); // active revenue: 8 * 350

    // Row 2: Out of stock (0 available)
    expect(lines[2]).toContain('"LIGHT-STR-100"');
    expect(lines[2]).toContain('"Warm LED Fairy String Lights, 100m Reel"');
    expect(lines[2]).toContain('"Out of Stock"');

    // Row 3: Healthy stock (150 > 30)
    expect(lines[3]).toContain('"SEAT-CHR-01"');
    expect(lines[3]).toContain('"Healthy"');
    expect(lines[3]).toContain('"N/A"'); // null location fallback
  });

  it('escapes quotes and commas according to RFC 4180', () => {
    const customItem: InventoryItem[] = [
      {
        id: 'test-1',
        workspace_id: 'ws-1',
        name: 'Tent "Super" 20x20, Heavy Duty',
        category: 'Tents, Canopies & Tarps',
        sku: 'TNT-20',
        total_quantity: 5,
        available_quantity: 5,
        reserved_quantity: 0,
        min_stock_level: 2,
        rental_rate_per_day: 100,
        unit: 'units',
        location: 'Bay "C"',
        notes: null,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-10-10T00:00:00Z',
      },
    ];

    const csv = generateInventoryCsv(customItem);
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('"Tent ""Super"" 20x20, Heavy Duty"');
    expect(lines[1]).toContain('"Tents, Canopies & Tarps"');
    expect(lines[1]).toContain('"Bay ""C"""');
  });

  it('handles empty inventory list cleanly', () => {
    const csv = generateInventoryCsv([]);
    expect(csv).toBe(
      'SKU,Item Name,Category,Total Units,Available Units,Reserved Units,Min Stock Level,Daily Rental Rate,Unit,Stock Status,Location,Daily Revenue Potential,Active Daily Revenue'
    );
  });
});
