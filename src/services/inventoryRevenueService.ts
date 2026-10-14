import { InventoryItem, Invoice, Payment, Enquiry } from '@/types/database';
import { inventoryService } from './inventoryService';
import { invoiceService } from './invoiceService';
import { paymentService } from './paymentService';
import { enquiryService } from './enquiryService';

export interface CategorySummary {
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  utilizationRate: number; // 0 - 100%
  dailyRevenuePotential: number; // total_quantity * rental_rate_per_day
  activeDailyRevenue: number; // reserved_quantity * rental_rate_per_day
  itemCount: number;
}

export interface RevenueAssetYield {
  id: string;
  name: string;
  category: string;
  sku: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  rentalRatePerDay: number;
  activeDailyRevenue: number;
  dailyRevenuePotential: number;
  utilizationRate: number;
  unit: string;
}

export interface InventoryRevenueSummary {
  totalCatalogItems: number;
  totalFleetUnits: number;
  totalAvailableUnits: number;
  totalReservedUnits: number;
  overallUtilizationRate: number; // 0 - 100%
  totalDailyRevenuePotential: number;
  activeDailyRevenue: number;
  collectedRevenue: number;
  outstandingReceivables: number;
  projectedPipelineRevenue: number;
  categories: CategorySummary[];
  topRevenueAssets: RevenueAssetYield[];
}

export function computeInventoryRevenueSummary(
  items: InventoryItem[],
  invoices: Invoice[],
  payments: Payment[],
  enquiries: Enquiry[]
): InventoryRevenueSummary {
  const totalCatalogItems = items.length;

  const totalFleetUnits = items.reduce(
    (sum, i) => sum + (Number(i.total_quantity) || 0),
    0
  );
  const totalAvailableUnits = items.reduce(
    (sum, i) => sum + (Number(i.available_quantity) || 0),
    0
  );
  const totalReservedUnits = items.reduce(
    (sum, i) => sum + (Number(i.reserved_quantity) || 0),
    0
  );

  const overallUtilizationRate =
    totalFleetUnits > 0
      ? Math.round((totalReservedUnits / totalFleetUnits) * 100 * 10) / 10
      : 0;

  const totalDailyRevenuePotential = items.reduce(
    (sum, i) =>
      sum + (Number(i.total_quantity) || 0) * (Number(i.rental_rate_per_day) || 0),
    0
  );

  const activeDailyRevenue = items.reduce(
    (sum, i) =>
      sum + (Number(i.reserved_quantity) || 0) * (Number(i.rental_rate_per_day) || 0),
    0
  );

  // Collected revenue from all payments
  const collectedRevenue = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  // Outstanding receivables from issued invoices with remaining balance
  const outstandingReceivables = invoices
    .filter(
      (inv) =>
        inv.status !== 'paid' &&
        inv.status !== 'cancelled' &&
        inv.status !== 'draft'
    )
    .reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0);

  // Pipeline potential from active non-converted enquiries
  const projectedPipelineRevenue = enquiries
    .filter((e) => e.status !== 'converted' && e.status !== 'not_converted')
    .reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);

  // Category breakdown
  const categoryMap = new Map<
    string,
    {
      totalQty: number;
      availableQty: number;
      reservedQty: number;
      dailyPotential: number;
      activeDaily: number;
      count: number;
    }
  >();

  items.forEach((item) => {
    const cat = item.category?.trim() || 'General Equipment';
    const current = categoryMap.get(cat) || {
      totalQty: 0,
      availableQty: 0,
      reservedQty: 0,
      dailyPotential: 0,
      activeDaily: 0,
      count: 0,
    };

    current.totalQty += Number(item.total_quantity) || 0;
    current.availableQty += Number(item.available_quantity) || 0;
    current.reservedQty += Number(item.reserved_quantity) || 0;
    current.dailyPotential +=
      (Number(item.total_quantity) || 0) * (Number(item.rental_rate_per_day) || 0);
    current.activeDaily +=
      (Number(item.reserved_quantity) || 0) * (Number(item.rental_rate_per_day) || 0);
    current.count += 1;

    categoryMap.set(cat, current);
  });

  const categories: CategorySummary[] = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      totalQuantity: stats.totalQty,
      availableQuantity: stats.availableQty,
      reservedQuantity: stats.reservedQty,
      utilizationRate:
        stats.totalQty > 0
          ? Math.round((stats.reservedQty / stats.totalQty) * 100 * 10) / 10
          : 0,
      dailyRevenuePotential: Math.round(stats.dailyPotential * 100) / 100,
      activeDailyRevenue: Math.round(stats.activeDaily * 100) / 100,
      itemCount: stats.count,
    }))
    .sort((a, b) => b.activeDailyRevenue - a.activeDailyRevenue);

  // Top revenue-generating rental gear
  const topRevenueAssets: RevenueAssetYield[] = items
    .map((item) => {
      const totalQty = Number(item.total_quantity) || 0;
      const reservedQty = Number(item.reserved_quantity) || 0;
      const availableQty = Number(item.available_quantity) || 0;
      const rate = Number(item.rental_rate_per_day) || 0;
      const activeDaily = Math.round(reservedQty * rate * 100) / 100;
      const potentialDaily = Math.round(totalQty * rate * 100) / 100;
      const utilRate =
        totalQty > 0 ? Math.round((reservedQty / totalQty) * 100 * 10) / 10 : 0;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        sku: item.sku,
        totalQuantity: totalQty,
        availableQuantity: availableQty,
        reservedQuantity: reservedQty,
        rentalRatePerDay: rate,
        activeDailyRevenue: activeDaily,
        dailyRevenuePotential: potentialDaily,
        utilizationRate: utilRate,
        unit: item.unit || 'units',
      };
    })
    .sort((a, b) => {
      if (b.activeDailyRevenue !== a.activeDailyRevenue) {
        return b.activeDailyRevenue - a.activeDailyRevenue;
      }
      return b.dailyRevenuePotential - a.dailyRevenuePotential;
    })
    .slice(0, 5);

  return {
    totalCatalogItems,
    totalFleetUnits,
    totalAvailableUnits,
    totalReservedUnits,
    overallUtilizationRate,
    totalDailyRevenuePotential: Math.round(totalDailyRevenuePotential * 100) / 100,
    activeDailyRevenue: Math.round(activeDailyRevenue * 100) / 100,
    collectedRevenue: Math.round(collectedRevenue * 100) / 100,
    outstandingReceivables: Math.round(outstandingReceivables * 100) / 100,
    projectedPipelineRevenue: Math.round(projectedPipelineRevenue * 100) / 100,
    categories,
    topRevenueAssets,
  };
}

export const inventoryRevenueService = {
  async getSummary(workspaceId: string): Promise<InventoryRevenueSummary> {
    const [items, invoices, payments, enquiries] = await Promise.all([
      inventoryService.getAll(workspaceId),
      invoiceService.getAll(workspaceId),
      paymentService.getAll(workspaceId),
      enquiryService.getAll(workspaceId),
    ]);

    return computeInventoryRevenueSummary(items, invoices, payments, enquiries);
  },
};
