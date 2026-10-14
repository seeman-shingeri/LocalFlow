import { describe, it, expect, beforeEach } from 'vitest';
import { inventoryService } from '../services/inventoryService';
import { localDb, INITIAL_INVENTORY } from '../lib/localStorageDb';
import { InventoryItem } from '../types/database';

describe('Inventory Low-Stock Alerts & Management', () => {
  const workspaceId = 'ws-apex-001';

  beforeEach(() => {
    // Reset local database state to initial seed
    localDb.resetAll();
  });

  it('correctly identifies items whose available quantity is below minimum stock level', async () => {
    const alerts = await inventoryService.getLowStockAlerts(workspaceId);

    expect(alerts.length).toBeGreaterThan(0);
    alerts.forEach((item) => {
      expect(Number(item.available_quantity)).toBeLessThanOrEqual(Number(item.min_stock_level));
    });

    // Known low stock items from seed:
    // SHAM-TNT-4060 (available 2 <= min 4)
    // SHAM-POLE-20 (available 5 <= min 15)
    // SEAT-CHR-WHT (available 40 <= min 100)
    // LIGHT-STR-100 (available 0 <= min 8)
    // SND-PA-SYS01 (available 1 <= min 3)
    const alertSkus = alerts.map((i) => i.sku);
    expect(alertSkus).toContain('SHAM-TNT-4060');
    expect(alertSkus).toContain('LIGHT-STR-100');
    expect(alertSkus).toContain('SEAT-CHR-WHT');
  });

  it('prioritizes completely out-of-stock items (available = 0) at the top of the alerts list', async () => {
    const alerts = await inventoryService.getLowStockAlerts(workspaceId);

    expect(alerts.length).toBeGreaterThan(0);
    // First item should be the completely depleted item
    expect(alerts[0].available_quantity).toBe(0);
    expect(alerts[0].sku).toBe('LIGHT-STR-100');
  });

  it('does not include healthy stock items in the alerts list', async () => {
    const alerts = await inventoryService.getLowStockAlerts(workspaceId);
    const alertSkus = alerts.map((i) => i.sku);

    // FLR-CRP-RED50 has available 18 > min 5
    // SEAT-TBL-60 has available 22 > min 10
    expect(alertSkus).not.toContain('FLR-CRP-RED50');
    expect(alertSkus).not.toContain('SEAT-TBL-60');
  });

  it('updates alert state immediately when stock is replenished above threshold', async () => {
    const alertsBefore = await inventoryService.getLowStockAlerts(workspaceId);
    expect(alertsBefore.some((i) => i.sku === 'SHAM-TNT-4060')).toBe(true);

    // Replenish tents: available 2 -> 10 (well above min 4)
    await inventoryService.updateStock('inv-001', {
      available_quantity: 10,
    });

    const alertsAfter = await inventoryService.getLowStockAlerts(workspaceId);
    expect(alertsAfter.some((i) => i.sku === 'SHAM-TNT-4060')).toBe(false);

    // Verify fetched item reflects new stock
    const item = await inventoryService.getById('inv-001');
    expect(item?.available_quantity).toBe(10);
  });

  it('rejects invalid negative stock updates with a clear validation error', async () => {
    await expect(
      inventoryService.updateStock('inv-001', {
        available_quantity: -5,
      })
    ).rejects.toThrow('Available quantity cannot be negative');

    await expect(
      inventoryService.updateStock('inv-001', {
        min_stock_level: -2,
      })
    ).rejects.toThrow('Minimum stock level cannot be negative');
  });

  it('supports category and keyword search across inventory equipment', async () => {
    const tentItems = await inventoryService.getAll(workspaceId, {
      category: 'Shamiyana & Tents',
    });
    expect(tentItems.every((i) => i.category === 'Shamiyana & Tents')).toBe(true);

    const searchResults = await inventoryService.getAll(workspaceId, {
      search: 'Chairs',
    });
    expect(searchResults.some((i) => i.sku === 'SEAT-CHR-WHT')).toBe(true);
  });
});
