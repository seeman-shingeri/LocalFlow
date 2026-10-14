import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/database';
import { inventoryService } from '@/services/inventoryService';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  Package,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { InventoryItemModal } from '@/components/inventory/InventoryItemModal';

interface LowStockAlertWidgetProps {
  workspaceId: string;
  onStockUpdated?: () => void;
}

export const LowStockAlertWidget: React.FC<LowStockAlertWidgetProps> = ({
  workspaceId,
  onStockUpdated,
}) => {
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getLowStockAlerts(workspaceId);
      setAlerts(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load inventory alert data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadAlerts();
    }
  }, [workspaceId]);

  const handleStockSuccess = () => {
    loadAlerts();
    if (onStockUpdated) onStockUpdated();
  };

  return (
    <>
      <Card className="border-slate-200/90 shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Low-Stock Inventory Alerts
                </CardTitle>
                {!loading && alerts.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.2 text-[11px] font-bold">
                    {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <CardDescription className="text-xs text-slate-500">
                Equipment below safety minimums for shamiyana & event rentals
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadAlerts}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh inventory alerts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </CardHeader>

        <div className="p-4 pt-0">
          {/* Loading State */}
          {loading && (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse"
                >
                  <div className="space-y-2">
                    <div className="h-3.5 w-40 bg-slate-200 rounded" />
                    <div className="h-2.5 w-24 bg-slate-200 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
              <p className="text-xs text-rose-700 font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAlerts}
                className="mt-2 text-xs text-rose-700 border-rose-200 hover:bg-rose-100"
              >
                Retry Loading
              </Button>
            </div>
          )}

          {/* Empty State (Healthy Inventory) */}
          {!loading && !error && alerts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800">All Inventory Levels Healthy</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                No shamiyana tents, chairs, poles, or event equipment are currently below their
                configured minimum safety threshold.
              </p>
            </div>
          )}

          {/* Active Alerts List */}
          {!loading && !error && alerts.length > 0 && (
            <div className="space-y-2.5">
              {alerts.map((item) => {
                const isZero = item.available_quantity === 0;
                const percentage =
                  item.min_stock_level > 0
                    ? Math.min(100, Math.round((item.available_quantity / item.min_stock_level) * 100))
                    : 0;

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      isZero
                        ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                        : 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.sku}
                        </span>
                        {isZero ? (
                          <span className="rounded-full bg-rose-600 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Low Stock
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Layers className="w-3 h-3 text-slate-400" />
                          Category: <strong>{item.category}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Available:{' '}
                          <strong className={isZero ? 'text-rose-600' : 'text-amber-700'}>
                            {item.available_quantity} {item.unit}
                          </strong>{' '}
                          (Min: {item.min_stock_level})
                        </span>
                        {item.location && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 truncate">{item.location}</span>
                          </>
                        )}
                      </div>

                      {/* Stock health indicator bar */}
                      <div className="w-full max-w-xs bg-slate-200/80 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isZero ? 'bg-rose-500 w-1' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="shrink-0 text-xs font-semibold hover:border-indigo-500 hover:text-indigo-600 self-end sm:self-center"
                    >
                      <SlidersHorizontal className="w-3 h-3 mr-1.5 text-slate-400" />
                      Manage Stock
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Item Inspection & Stock Adjustment Modal */}
      <InventoryItemModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onSuccess={handleStockSuccess}
      />
    </>
  );
};
