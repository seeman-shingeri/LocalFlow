import { describe, it, expect } from 'vitest';
import {
  calculateReorderRecommendation,
  InventoryItemStockContext,
} from '@/lib/reorderRecommendation';

describe('Inventory Reorder Quantity & Stock Replenishment Recommendation Engine (reorderRecommendation)', () => {
  it('triggers immediate reorder when stock is below minimum safe threshold', () => {
    const item: InventoryItemStockContext = {
      id: 'tent-deluxe',
      name: 'Deluxe Shamiyana 40x60',
      currentStock: 4,
      minStockLevel: 10,
      unitCostPrice: 12000,
    };

    // targetSafeStock = ceil(10 * 1.2) = 12. Shortfall = 12 - 4 = 8
    const rec = calculateReorderRecommendation(item);
    expect(rec.urgency).toBe('reorder_immediately');
    expect(rec.recommendedOrderQty).toBe(8);
    expect(rec.estimatedExpense).toBe(96000);
    expect(rec.reason).toContain('below minimum safe threshold');
  });

  it('accounts for upcoming reserved quantities causing deficit', () => {
    const item: InventoryItemStockContext = {
      id: 'sofa-royal',
      name: 'Royal VIP Sofa Set',
      currentStock: 15,
      minStockLevel: 10,
      upcomingReservedQuantity: 18, // 3 units short!
      unitCostPrice: 3500,
    };

    const rec = calculateReorderRecommendation(item);
    // effectiveAvailableStock = -3. targetSafeStock = 12. recommended = 3 + 12 = 15
    expect(rec.urgency).toBe('reorder_immediately');
    expect(rec.effectiveAvailableStock).toBe(-3);
    expect(rec.recommendedOrderQty).toBe(15);
    expect(rec.estimatedExpense).toBe(52500);
  });

  it('marks stock as sufficient when exceeding buffer requirements', () => {
    const item: InventoryItemStockContext = {
      id: 'chair-plastic',
      name: 'Banquet Chairs',
      currentStock: 250,
      minStockLevel: 100,
      upcomingReservedQuantity: 50,
      unitCostPrice: 400,
    };

    // effective = 200, targetSafeStock = 120. Healthy!
    const rec = calculateReorderRecommendation(item);
    expect(rec.urgency).toBe('sufficient');
    expect(rec.recommendedOrderQty).toBe(0);
    expect(rec.estimatedExpense).toBe(0);
  });
});
