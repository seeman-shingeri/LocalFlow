import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/types/database';
import { inventoryService } from '@/services/inventoryService';
import { formatCurrency } from '@/lib/utils';
import {
  X,
  Package,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Tag,
  DollarSign,
  TrendingDown,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [availableQty, setAvailableQty] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setAvailableQty(item.available_quantity);
      setMinStock(item.min_stock_level);
      setNotes(item.notes || '');
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isLowStock = availableQty <= minStock;
  const isOutOfStock = availableQty === 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availableQty < 0 || minStock < 0) {
      setError('Quantities cannot be negative.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await inventoryService.updateStock(item.id, {
        available_quantity: Number(availableQty),
        min_stock_level: Number(minStock),
        notes: notes.trim() || null,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update inventory stock.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isOutOfStock
                  ? 'bg-rose-100 text-rose-700'
                  : isLowStock
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isLowStock ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                  {item.sku}
                </span>
                <span className="text-xs font-medium text-slate-500">{item.category}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specifications & Location */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Total Owned</span>
            <span className="font-bold text-slate-800 text-sm">
              {item.total_quantity} {item.unit}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Reserved for Events</span>
            <span className="font-bold text-indigo-600 text-sm">
              {item.reserved_quantity} {item.unit}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Rental Rate</span>
            <span className="font-bold text-slate-800 text-sm">
              {formatCurrency(item.rental_rate_per_day)}/day
            </span>
          </div>
          {item.location && (
            <div className="col-span-2 sm:col-span-3 flex items-center gap-1.5 text-slate-500 pt-1 border-t border-slate-200/60">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Location: <strong className="text-slate-700">{item.location}</strong></span>
            </div>
          )}
        </div>

        {/* Status Pill */}
        <div className="mb-4">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>CRITICAL:</strong> Currently Out of Stock. All units are deployed or reserved.
              </span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>LOW STOCK WARNING:</strong> Available quantity ({availableQty}) is at or below minimum threshold ({minStock}).
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Stock level is healthy and ready for rental bookings.</span>
            </div>
          )}
        </div>

        {/* Stock Adjustment Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available In Warehouse
              </label>
              <input
                type="number"
                min="0"
                value={availableQty}
                onChange={(e) => setAvailableQty(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Units unreserved & ready
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min. Alert Level
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Threshold for dashboard alert
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item / Maintenance Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add inspection notes, damage reports, or return details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Updating...' : 'Update Stock Level'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
