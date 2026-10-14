import React, { useState, useEffect } from 'react';
import {
  inventoryRevenueService,
  InventoryRevenueSummary,
  RevenueAssetYield,
} from '@/services/inventoryRevenueService';
import { InventoryItem } from '@/types/database';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItemModal } from '@/components/inventory/InventoryItemModal';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import {
  Layers,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  AlertCircle,
  Package,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface InventoryRevenueSummaryWidgetProps {
  workspaceId: string;
  currency?: string;
  onStockUpdated?: () => void;
}

export const InventoryRevenueSummaryWidget: React.FC<
  InventoryRevenueSummaryWidgetProps
> = ({ workspaceId, currency = 'USD', onStockUpdated }) => {
  const [summary, setSummary] = useState<InventoryRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryRevenueService.getSummary(workspaceId);
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory and revenue summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadSummary();
    }
  }, [workspaceId]);

  const handleOpenItem = async (asset: RevenueAssetYield) => {
    try {
      const item = await inventoryService.getById(asset.id);
      if (item) {
        setSelectedItem(item);
        setItemModalOpen(true);
      }
    } catch {
      // fallback
    }
  };

  const handleStockUpdateSuccess = () => {
    loadSummary();
    if (onStockUpdated) {
      onStockUpdated();
    }
  };

  const filteredCategories =
    selectedCategory === 'all'
      ? summary?.categories || []
      : (summary?.categories || []).filter((c) => c.category === selectedCategory);

  return (
    <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Inventory Fleet & Rental Revenue Summary
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Utilization
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active equipment deployment, daily rental run-rate, and cash flow realization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Category filter */}
            {summary && summary.categories.length > 0 && (
              <select
                aria-label="Filter by equipment category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Categories ({summary.categories.length})</option>
                {summary.categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={loadSummary}
              disabled={loading}
              className="text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content Body */}
      {loading && !summary ? (
        <div className="p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-slate-50 text-indigo-600 mb-3 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Calculating inventory metrics & rental yield...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Aggregating fleet units, deployed stock, and revenue streams
          </p>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-rose-900">{error}</p>
          <Button variant="outline" size="sm" onClick={loadSummary} className="mt-3">
            Retry
          </Button>
        </div>
      ) : summary ? (
        <div className="p-5 space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tile 1: Overall Utilization */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Fleet Utilization</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    summary.overallUtilizationRate >= 75
                      ? 'bg-emerald-100 text-emerald-800'
                      : summary.overallUtilizationRate >= 40
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {summary.overallUtilizationRate >= 75
                    ? 'High Demand'
                    : summary.overallUtilizationRate >= 40
                    ? 'Optimal'
                    : 'Available Capacity'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {summary.overallUtilizationRate}%
                </span>
                <span className="text-xs text-slate-500">
                  ({summary.totalReservedUnits} / {summary.totalFleetUnits} units deployed)
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, summary.overallUtilizationRate)}%` }}
                />
              </div>
            </div>

            {/* Tile 2: Active Daily Rental Run-rate */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Active Daily Rental Yield</span>
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(summary.activeDailyRevenue, currency)}
                </span>
                <span className="text-xs text-slate-500"> / day</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Currently actively deployed on customer events
              </p>
            </div>

            {/* Tile 3: Fleet Daily Potential */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Fleet Daily Capacity</span>
                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(summary.totalDailyRevenuePotential, currency)}
                </span>
                <span className="text-xs text-slate-500"> / day</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                At 100% capacity across {summary.totalCatalogItems} gear lines
              </p>
            </div>

            {/* Tile 4: Pipeline Realization */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Cash Flow Realization</span>
                <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(
                    summary.collectedRevenue + summary.outstandingReceivables,
                    currency
                  )}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Collected: {formatCurrency(summary.collectedRevenue, currency)}</span>
                <span>Due: {formatCurrency(summary.outstandingReceivables, currency)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown: Category Progress + Top Revenue Assets */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Category Breakdown (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Category Equipment Utilization
                </h4>
                <span className="text-xs text-slate-400">
                  {filteredCategories.length} categories shown
                </span>
              </div>

              <div className="space-y-3">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div
                      key={cat.category}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{cat.category}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/60 font-semibold text-slate-600">
                            {cat.itemCount} items
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="font-semibold text-slate-700">
                            {cat.reservedQuantity} / {cat.totalQuantity} units
                          </span>
                          <span
                            className={`font-black ${
                              cat.utilizationRate >= 80
                                ? 'text-emerald-700'
                                : cat.utilizationRate >= 40
                                ? 'text-indigo-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {cat.utilizationRate}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            cat.utilizationRate >= 80
                              ? 'bg-emerald-500'
                              : cat.utilizationRate >= 40
                              ? 'bg-indigo-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, cat.utilizationRate)}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Available: <strong className="text-slate-700">{cat.availableQuantity}</strong>
                        </span>
                        <span>
                          Active Yield:{' '}
                          <strong className="text-emerald-700 font-bold">
                            {formatCurrency(cat.activeDailyRevenue, currency)}/day
                          </strong>{' '}
                          (Max: {formatCurrency(cat.dailyRevenuePotential, currency)})
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No categories found for this selection.
                  </p>
                )}
              </div>
            </div>

            {/* Top Revenue-Yielding Rental Gear (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Top Revenue Rental Gear
                </h4>
                <span className="text-xs text-slate-400">Ranked by daily yield</span>
              </div>

              <div className="space-y-2.5">
                {summary.topRevenueAssets.length > 0 ? (
                  summary.topRevenueAssets.map((asset, index) => (
                    <div
                      key={asset.id}
                      onClick={() => handleOpenItem(asset)}
                      className="group p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xs transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                              {index + 1}
                            </span>
                            <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {asset.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-mono text-[10px] text-slate-400">
                              {asset.sku}
                            </span>
                            <span>•</span>
                            <span>
                              {asset.reservedQuantity}/{asset.totalQuantity} {asset.unit} booked
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black text-emerald-700">
                            {formatCurrency(asset.activeDailyRevenue, currency)}
                            <span className="text-[10px] font-normal text-slate-500">/day</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            @{formatCurrency(asset.rentalRatePerDay, currency)}/{asset.unit}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-50 text-[10px] text-slate-400 group-hover:text-indigo-600">
                        <span>Utilization: {asset.utilizationRate}%</span>
                        <span className="flex items-center gap-0.5 font-medium">
                          Inspect & Adjust <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No rental gear recorded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stock Inspection & Adjustment Modal */}
      <InventoryItemModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        item={selectedItem}
        onSuccess={handleStockUpdateSuccess}
      />
    </Card>
  );
};
