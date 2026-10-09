import { Enquiry, EnquiryStatus } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';

export const enquiryService = {
  async getAll(workspaceId: string, filter?: { status?: string; customerId?: string }): Promise<Enquiry[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('enquiries')
        .select('*, customer:customers(*)')
        .eq('workspace_id', workspaceId);

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.customerId) {
        query = query.eq('customer_id', filter.customerId);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      let enquiries = localDb.getEnquiries(workspaceId);
      const customers = localDb.getCustomers(workspaceId);

      if (filter?.status && filter.status !== 'all') {
        enquiries = enquiries.filter((e) => e.status === filter.status);
      }
      if (filter?.customerId) {
        enquiries = enquiries.filter((e) => e.customer_id === filter.customerId);
      }

      return enquiries
        .map((e) => ({
          ...e,
          customer: customers.find((c) => c.id === e.customer_id),
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async create(enquiryData: Omit<Enquiry, 'id' | 'created_at' | 'updated_at'>): Promise<Enquiry> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enquiries')
        .insert({
          ...enquiryData,
          created_at: now,
          updated_at: now,
        })
        .select('*, customer:customers(*)')
        .single();
      if (error) throw error;
      return data;
    } else {
      const all = localDb.getEnquiries();
      const newEnq: Enquiry = {
        ...enquiryData,
        id: `enq-${Date.now()}`,
        created_at: now,
        updated_at: now,
      };
      all.unshift(newEnq);
      localDb.saveEnquiries(all);

      const customer = localDb.getCustomers().find((c) => c.id === enquiryData.customer_id);
      return { ...newEnq, customer };
    }
  },

  async update(id: string, updates: Partial<Enquiry>): Promise<Enquiry> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enquiries')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .select('*, customer:customers(*)')
        .single();
      if (error) throw error;
      return data;
    } else {
      const all = localDb.getEnquiries();
      const idx = all.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error('Enquiry not found');
      const updated = {
        ...all[idx],
        ...updates,
        updated_at: now,
      };
      all[idx] = updated;
      localDb.saveEnquiries(all);

      const customer = localDb.getCustomers().find((c) => c.id === updated.customer_id);
      return { ...updated, customer };
    }
  },

  async updateStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
    return this.update(id, { status });
  },

  async delete(id: string, workspaceId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('enquiries').delete().eq('id', id).eq('workspace_id', workspaceId);
      if (error) throw error;
    } else {
      const all = localDb.getEnquiries();
      const filtered = all.filter((e) => e.id !== id);
      localDb.saveEnquiries(filtered);
    }
  },
};
