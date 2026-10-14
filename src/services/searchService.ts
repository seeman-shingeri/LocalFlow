import { localDb } from '@/lib/localStorageDb';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';

export type SearchEntityType = 'all' | 'customer' | 'inventory' | 'invoice' | 'enquiry' | 'appointment';

export interface SearchResultItem {
  id: string;
  type: 'customer' | 'inventory' | 'invoice' | 'enquiry' | 'appointment';
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
  meta?: string;
  url?: string;
  rawData?: any;
}

export const searchService = {
  async searchAll(
    workspaceId: string,
    rawQuery: string,
    typeFilter: SearchEntityType = 'all'
  ): Promise<SearchResultItem[]> {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return [];

    const results: SearchResultItem[] = [];

    // 1. Customers
    if (typeFilter === 'all' || typeFilter === 'customer') {
      const customers = localDb.getCustomers(workspaceId);
      for (const c of customers) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);

        if (matchesName || matchesEmail || matchesPhone || matchesNotes) {
          results.push({
            id: c.id,
            type: 'customer',
            title: c.name,
            subtitle: c.phone ? `${c.phone} • ${c.email || 'No email'}` : c.email || 'Customer',
            badge: c.status.toUpperCase(),
            badgeVariant: c.status === 'active' ? 'success' : c.status === 'lead' ? 'warning' : 'neutral',
            meta: c.source ? `Source: ${c.source}` : undefined,
            url: `/customers?id=${c.id}`,
            rawData: c,
          });
        }
      }
    }

    // 2. Inventory Items (Shamiyana tents, equipment, seating, etc.)
    if (typeFilter === 'all' || typeFilter === 'inventory') {
      const inventory = localDb.getInventory(workspaceId);
      for (const inv of inventory) {
        const matchesName = inv.name.toLowerCase().includes(q);
        const matchesSku = inv.sku.toLowerCase().includes(q);
        const matchesCategory = inv.category.toLowerCase().includes(q);
        const matchesLocation = inv.location?.toLowerCase().includes(q);
        const matchesNotes = inv.notes?.toLowerCase().includes(q);

        if (matchesName || matchesSku || matchesCategory || matchesLocation || matchesNotes) {
          const isOutOfStock = inv.available_quantity === 0;
          const isLowStock = inv.available_quantity <= inv.min_stock_level;

          results.push({
            id: inv.id,
            type: 'inventory',
            title: inv.name,
            subtitle: `${inv.sku} • ${inv.category} • ${inv.available_quantity} ${inv.unit} available`,
            badge: isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK',
            badgeVariant: isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success',
            meta: `${formatCurrency(inv.rental_rate_per_day)}/day${inv.location ? ` • ${inv.location}` : ''}`,
            url: `/?manageItem=${inv.id}`,
            rawData: inv,
          });
        }
      }
    }

    // 3. Invoices
    if (typeFilter === 'all' || typeFilter === 'invoice') {
      const invoices = localDb.getInvoices(workspaceId);
      const customers = localDb.getCustomers(workspaceId);
      for (const inv of invoices) {
        const cust = customers.find((c) => c.id === inv.customer_id);
        const matchesNumber = inv.invoice_number.toLowerCase().includes(q);
        const matchesCustName = cust?.name.toLowerCase().includes(q);
        const matchesNotes = inv.notes?.toLowerCase().includes(q);

        if (matchesNumber || matchesCustName || matchesNotes) {
          results.push({
            id: inv.id,
            type: 'invoice',
            title: `Invoice ${inv.invoice_number}`,
            subtitle: cust ? `Client: ${cust.name}` : 'No customer attached',
            badge: inv.status.toUpperCase(),
            badgeVariant:
              inv.status === 'paid'
                ? 'success'
                : inv.status === 'overdue'
                ? 'danger'
                : inv.status === 'partial'
                ? 'warning'
                : 'neutral',
            meta: `Total: ${formatCurrency(inv.total_amount)} • Due: ${formatDate(inv.due_date)}`,
            url: `/invoices?search=${encodeURIComponent(inv.invoice_number)}`,
            rawData: inv,
          });
        }
      }
    }

    // 4. Enquiries (Deals & Quotes)
    if (typeFilter === 'all' || typeFilter === 'enquiry') {
      const enquiries = localDb.getEnquiries(workspaceId);
      const customers = localDb.getCustomers(workspaceId);
      for (const enq of enquiries) {
        const cust = customers.find((c) => c.id === enq.customer_id);
        const matchesTitle = enq.title.toLowerCase().includes(q);
        const matchesService = enq.service_type?.toLowerCase().includes(q);
        const matchesCust = cust?.name.toLowerCase().includes(q);
        const matchesNotes = enq.notes?.toLowerCase().includes(q);

        if (matchesTitle || matchesService || matchesCust || matchesNotes) {
          results.push({
            id: enq.id,
            type: 'enquiry',
            title: enq.title,
            subtitle: cust ? `Client: ${cust.name}` : enq.service_type || 'Event Enquiry',
            badge: enq.status.replace('_', ' ').toUpperCase(),
            badgeVariant: enq.status === 'converted' ? 'success' : enq.priority === 'high' ? 'danger' : 'default',
            meta: `Value: ${formatCurrency(enq.estimated_value)} • Priority: ${enq.priority}`,
            url: `/enquiries?search=${encodeURIComponent(enq.title)}`,
            rawData: enq,
          });
        }
      }
    }

    // 5. Appointments & Event Bookings
    if (typeFilter === 'all' || typeFilter === 'appointment') {
      const appointments = localDb.getAppointments(workspaceId);
      const customers = localDb.getCustomers(workspaceId);
      for (const apt of appointments) {
        const cust = customers.find((c) => c.id === apt.customer_id);
        const matchesTitle = apt.title.toLowerCase().includes(q);
        const matchesCust = cust?.name.toLowerCase().includes(q);
        const matchesLoc = apt.location?.toLowerCase().includes(q);
        const matchesNotes = apt.notes?.toLowerCase().includes(q);

        if (matchesTitle || matchesCust || matchesLoc || matchesNotes) {
          results.push({
            id: apt.id,
            type: 'appointment',
            title: apt.title,
            subtitle: cust ? `Client: ${cust.name}` : apt.location || 'Booking',
            badge: apt.status.toUpperCase(),
            badgeVariant: apt.status === 'completed' ? 'success' : apt.status === 'scheduled' ? 'default' : 'neutral',
            meta: `${formatDate(apt.start_time)}${apt.location ? ` • ${apt.location}` : ''}`,
            url: `/appointments`,
            rawData: apt,
          });
        }
      }
    }

    return results;
  },
};
