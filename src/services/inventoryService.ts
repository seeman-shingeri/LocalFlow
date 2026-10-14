import { InventoryItem } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';

export const inventoryService = {
  async getAll(
    workspaceId: string,
    filter?: { category?: string; lowStockOnly?: boolean; search?: string }
  ): Promise<InventoryItem[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (filter?.category && filter.category !== 'all') {
        query = query.eq('category', filter.category);
      }

      query = query.order('name', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      let items: InventoryItem[] = data || [];

      if (filter?.lowStockOnly) {
        items = items.filter((i) => Number(i.available_quantity) <= Number(i.min_stock_level));
      }
      if (filter?.search?.trim()) {
        const q = filter.search.toLowerCase().trim();
        items = items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q)
        );
      }
      return items;
    } else {
      let items = localDb.getInventory(workspaceId);

      if (filter?.category && filter.category !== 'all') {
        items = items.filter((i) => i.category === filter.category);
      }
      if (filter?.lowStockOnly) {
        items = items.filter((i) => Number(i.available_quantity) <= Number(i.min_stock_level));
      }
      if (filter?.search?.trim()) {
        const q = filter.search.toLowerCase().trim();
        items = items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q)
        );
      }
      return items;
    }
  },

  async getLowStockAlerts(workspaceId: string): Promise<InventoryItem[]> {
    const all = await this.getAll(workspaceId);
    return all
      .filter((item) => Number(item.available_quantity) <= Number(item.min_stock_level))
      .sort((a, b) => {
        // Out of stock items first
        if (a.available_quantity === 0 && b.available_quantity > 0) return -1;
        if (b.available_quantity === 0 && a.available_quantity > 0) return 1;
        // Then sort by ratio of available to minimum stock (most depleted first)
        const ratioA = a.min_stock_level > 0 ? a.available_quantity / a.min_stock_level : 0;
        const ratioB = b.min_stock_level > 0 ? b.available_quantity / b.min_stock_level : 0;
        return ratioA - ratioB;
      });
  },

  async getById(id: string): Promise<InventoryItem | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    } else {
      return localDb.getInventoryItem(id) || null;
    }
  },

  async updateStock(
    id: string,
    updates: {
      available_quantity?: number;
      reserved_quantity?: number;
      min_stock_level?: number;
      notes?: string | null;
    }
  ): Promise<InventoryItem> {
    // Validate inputs
    if (updates.available_quantity !== undefined && updates.available_quantity < 0) {
      throw new Error('Available quantity cannot be negative');
    }
    if (updates.min_stock_level !== undefined && updates.min_stock_level < 0) {
      throw new Error('Minimum stock level cannot be negative');
    }

    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      return localDb.updateInventoryItem(id, updates);
    }
  },
};
