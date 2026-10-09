import { Customer, Enquiry, Appointment, Invoice, Payment, CommunicationLog } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';

export interface CustomerWithRelations extends Customer {
  enquiries: Enquiry[];
  appointments: Appointment[];
  invoices: Invoice[];
  payments: Payment[];
  communications: CommunicationLog[];
}

export const customerService = {
  async getAll(workspaceId: string, filter?: { search?: string; status?: string }): Promise<Customer[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('customers').select('*').eq('workspace_id', workspaceId);
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%,phone.ilike.%${filter.search}%`);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      let customers = localDb.getCustomers(workspaceId);
      if (filter?.status && filter.status !== 'all') {
        customers = customers.filter((c) => c.status === filter.status);
      }
      if (filter?.search) {
        const s = filter.search.toLowerCase();
        customers = customers.filter(
          (c) =>
            c.name.toLowerCase().includes(s) ||
            (c.email && c.email.toLowerCase().includes(s)) ||
            (c.phone && c.phone.toLowerCase().includes(s))
        );
      }
      return customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async getById(id: string, workspaceId: string): Promise<CustomerWithRelations | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .single();
      if (error || !customer) return null;

      const [enquiriesRes, appointmentsRes, invoicesRes, paymentsRes, commsRes] = await Promise.all([
        supabase.from('enquiries').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').eq('customer_id', id).order('start_time', { ascending: false }),
        supabase.from('invoices').select('*, items:invoice_items(*)').eq('customer_id', id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('customer_id', id).order('payment_date', { ascending: false }),
        supabase.from('communication_logs').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      ]);

      return {
        ...customer,
        enquiries: enquiriesRes.data || [],
        appointments: appointmentsRes.data || [],
        invoices: invoicesRes.data || [],
        payments: paymentsRes.data || [],
        communications: commsRes.data || [],
      };
    } else {
      const customers = localDb.getCustomers(workspaceId);
      const customer = customers.find((c) => c.id === id);
      if (!customer) return null;

      const enquiries = localDb.getEnquiries(workspaceId).filter((e) => e.customer_id === id);
      const appointments = localDb.getAppointments(workspaceId).filter((a) => a.customer_id === id);
      const invoices = localDb.getInvoices(workspaceId).filter((i) => i.customer_id === id);
      const payments = localDb.getPayments(workspaceId).filter((p) => p.customer_id === id);
      const communications = localDb.getCommunications(id);

      return {
        ...customer,
        enquiries,
        appointments,
        invoices,
        payments,
        communications,
      };
    }
  },

  async checkDuplicate(workspaceId: string, email?: string, phone?: string, excludeId?: string): Promise<Customer | null> {
    if (!email && !phone) return null;
    const all = await this.getAll(workspaceId);
    return all.find((c) => {
      if (excludeId && c.id === excludeId) return false;
      const emailMatch = email && c.email && c.email.trim().toLowerCase() === email.trim().toLowerCase();
      const phoneMatch = phone && c.phone && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '');
      return emailMatch || phoneMatch;
    }) || null;
  },

  async create(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      const all = localDb.getCustomers();
      const newCust: Customer = {
        ...customerData,
        id: `cust-${Date.now()}`,
        created_at: now,
        updated_at: now,
      };
      all.unshift(newCust);
      localDb.saveCustomers(all);
      return newCust;
    }
  },

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('customers')
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
      const all = localDb.getCustomers();
      const idx = all.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Customer not found');
      const updated = {
        ...all[idx],
        ...updates,
        updated_at: now,
      };
      all[idx] = updated;
      localDb.saveCustomers(all);
      return updated;
    }
  },

  async archive(id: string): Promise<Customer> {
    return this.update(id, { status: 'archived' });
  },

  async delete(id: string, workspaceId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('customers').delete().eq('id', id).eq('workspace_id', workspaceId);
      if (error) throw error;
    } else {
      const all = localDb.getCustomers();
      const filtered = all.filter((c) => c.id !== id);
      localDb.saveCustomers(filtered);
    }
  },
};
