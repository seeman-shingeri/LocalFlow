export type ReplenishmentUrgency = 'reorder_immediately' | 'reorder_soon' | 'sufficient';

export interface InventoryItemStockContext {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  upcomingReservedQuantity?: number;
  unitCostPrice?: number;
  leadTimeDays?: number;
}

export interface ReplenishmentRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  effectiveAvailableStock: number;
  recommendedOrderQty: number;
  estimatedExpense: number;
  urgency: ReplenishmentUrgency;
  reason: string;
}

/**
 * Recommends optimal reorder units and financial budget needed to avoid rental equipment shortages.
 */
export function calculateReorderRecommendation(
  item: InventoryItemStockContext,
  safetyStockBufferMultiplier: number = 1.2
): ReplenishmentRecommendation {
  const currentStock = Math.max(0, item.currentStock);
  const minStock = Math.max(1, item.minStockLevel);
  const reserved = Math.max(0, item.upcomingReservedQuantity || 0);
  const unitCost = Math.max(0, item.unitCostPrice || 0);

  // Effective stock considers items already committed to upcoming events
  const effectiveAvailableStock = currentStock - reserved;

  const targetSafeStock = Math.ceil(minStock * safetyStockBufferMultiplier);

  if (effectiveAvailableStock <= 0) {
    // Critical shortfall
    const shortage = Math.abs(effectiveAvailableStock);
    const recommendedOrderQty = shortage + targetSafeStock;
    return {
      itemId: item.id,
      itemName: item.name,
      currentStock,
      effectiveAvailableStock,
      recommendedOrderQty,
      estimatedExpense: recommendedOrderQty * unitCost,
      urgency: 'reorder_immediately',
      reason: `Stock is depleted or fully booked (-${shortage} units deficit). Immediate reorder required.`,
    };
  }

  if (effectiveAvailableStock < minStock) {
    const recommendedOrderQty = targetSafeStock - effectiveAvailableStock;
    return {
      itemId: item.id,
      itemName: item.name,
      currentStock,
      effectiveAvailableStock,
      recommendedOrderQty,
      estimatedExpense: recommendedOrderQty * unitCost,
      urgency: 'reorder_immediately',
      reason: `Effective stock (${effectiveAvailableStock}) is below minimum safe threshold (${minStock}).`,
    };
  }

  if (effectiveAvailableStock < targetSafeStock) {
    const recommendedOrderQty = targetSafeStock - effectiveAvailableStock;
    return {
      itemId: item.id,
      itemName: item.name,
      currentStock,
      effectiveAvailableStock,
      recommendedOrderQty,
      estimatedExpense: recommendedOrderQty * unitCost,
      urgency: 'reorder_soon',
      reason: `Approaching buffer threshold. Reordering soon avoids upcoming peak season stockout.`,
    };
  }

  return {
    itemId: item.id,
    itemName: item.name,
    currentStock,
    effectiveAvailableStock,
    recommendedOrderQty: 0,
    estimatedExpense: 0,
    urgency: 'sufficient',
    reason: 'Stock levels are healthy and exceed safety thresholds.',
  };
}
