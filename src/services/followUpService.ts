import { FollowUp, FollowUpStatus } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';
import { isDateOverdue, isDateToday } from '@/lib/utils';
import { isFuture, parseISO } from 'date-fns';

export interface CategorizedFollowUps {
  overdue: FollowUp[];
  today: FollowUp[];
  upcoming: FollowUp[];
  completed: FollowUp[];
}

export const followUpService = {
  async getAll(workspaceId: string): Promise<FollowUp[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*, customer:customers(*), enquiry:enquiries(*)')
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const followUps = localDb.getFollowUps(workspaceId);
      const customers = localDb.getCustomers(workspaceId);
      const enquiries = localDb.getEnquiries(workspaceId);

      return followUps
        .map((f) => ({
          ...f,
          customer: customers.find((c) => c.id === f.customer_id),
          enquiry: enquiries.find((e) => e.id === f.enquiry_id),
        }))
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    }
  },

  async getCategorized(workspaceId: string): Promise<CategorizedFollowUps> {
    const all = await this.getAll(workspaceId);

    const pending = all.filter((f) => f.status === 'pending');
    const completed = all.filter((f) => f.status === 'completed' || f.status === 'cancelled');

    const overdue: FollowUp[] = [];
    const today: FollowUp[] = [];
    const upcoming: FollowUp[] = [];

    pending.forEach((item) => {
      if (isDateOverdue(item.due_date)) {
        overdue.push(item);
      } else if (isDateToday(item.due_date)) {
        today.push(item);
      } else if (isFuture(parseISO(item.due_date))) {
        upcoming.push(item);
      } else {
        // Fallback for edge cases
        today.push(item);
      }
    });

    return {
      overdue,
      today,
      upcoming,
      completed,
    };
  },

  async create(followUpData: Omit<FollowUp, 'id' | 'created_at' | 'updated_at' | 'completed_at'>): Promise<FollowUp> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('follow_ups')
        .insert({
          ...followUpData,
          completed_at: null,
          created_at: now,
          updated_at: now,
        })
        .select('*, customer:customers(*), enquiry:enquiries(*)')
        .single();
      if (error) throw error;

      // Update customer's next follow up date
      await supabase
        .from('customers')
        .update({ next_follow_up_date: followUpData.due_date })
        .eq('id', followUpData.customer_id);

      return data;
    } else {
      const all = localDb.getFollowUps();
      const newFollowUp: FollowUp = {
        ...followUpData,
        id: `flw-${Date.now()}`,
        completed_at: null,
        created_at: now,
        updated_at: now,
      };
      all.push(newFollowUp);
      localDb.saveFollowUps(all);

      // Update customer
      const customers = localDb.getCustomers();
      const cIdx = customers.findIndex((c) => c.id === followUpData.customer_id);
      if (cIdx !== -1) {
        customers[cIdx].next_follow_up_date = followUpData.due_date;
        localDb.saveCustomers(customers);
      }

      const customer = customers.find((c) => c.id === followUpData.customer_id);
      const enquiry = localDb.getEnquiries().find((e) => e.id === followUpData.enquiry_id);
      return { ...newFollowUp, customer, enquiry };
    }
  },

  async markComplete(id: string, notes?: string): Promise<FollowUp> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('follow_ups')
        .update({
          status: 'completed',
          completed_at: now,
          notes: notes ? notes : undefined,
          updated_at: now,
        })
        .eq('id', id)
        .select('*, customer:customers(*), enquiry:enquiries(*)')
        .single();
      if (error) throw error;

      if (data?.customer_id) {
        await supabase
          .from('customers')
          .update({ last_contact_date: now })
          .eq('id', data.customer_id);
      }
      return data;
    } else {
      const all = localDb.getFollowUps();
      const idx = all.findIndex((f) => f.id === id);
      if (idx === -1) throw new Error('Follow-up not found');

      const updated: FollowUp = {
        ...all[idx],
        status: 'completed' as FollowUpStatus,
        completed_at: now,
        notes: notes ? `${all[idx].notes || ''}\n[Completed Note]: ${notes}`.trim() : all[idx].notes,
        updated_at: now,
      };
      all[idx] = updated;
      localDb.saveFollowUps(all);

      // Update customer last contact date
      const customers = localDb.getCustomers();
      const cIdx = customers.findIndex((c) => c.id === updated.customer_id);
      if (cIdx !== -1) {
        customers[cIdx].last_contact_date = now;
        localDb.saveCustomers(customers);
      }

      const customer = customers.find((c) => c.id === updated.customer_id);
      const enquiry = localDb.getEnquiries().find((e) => e.id === updated.enquiry_id);
      return { ...updated, customer, enquiry };
    }
  },

  async reschedule(id: string, newDueDate: string, notes?: string): Promise<FollowUp> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('follow_ups')
        .update({
          due_date: newDueDate,
          status: 'pending',
          notes: notes ? notes : undefined,
          updated_at: now,
        })
        .eq('id', id)
        .select('*, customer:customers(*), enquiry:enquiries(*)')
        .single();
      if (error) throw error;

      if (data?.customer_id) {
        await supabase
          .from('customers')
          .update({ next_follow_up_date: newDueDate })
          .eq('id', data.customer_id);
      }
      return data;
    } else {
      const all = localDb.getFollowUps();
      const idx = all.findIndex((f) => f.id === id);
      if (idx === -1) throw new Error('Follow-up not found');

      const updated: FollowUp = {
        ...all[idx],
        due_date: newDueDate,
        status: 'pending',
        notes: notes ? `${all[idx].notes || ''}\n[Rescheduled]: ${notes}`.trim() : all[idx].notes,
        updated_at: now,
      };
      all[idx] = updated;
      localDb.saveFollowUps(all);

      const customers = localDb.getCustomers();
      const cIdx = customers.findIndex((c) => c.id === updated.customer_id);
      if (cIdx !== -1) {
        customers[cIdx].next_follow_up_date = newDueDate;
        localDb.saveCustomers(customers);
      }

      const customer = customers.find((c) => c.id === updated.customer_id);
      const enquiry = localDb.getEnquiries().find((e) => e.id === updated.enquiry_id);
      return { ...updated, customer, enquiry };
    }
  },

  async delete(id: string, workspaceId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('follow_ups').delete().eq('id', id).eq('workspace_id', workspaceId);
      if (error) throw error;
    } else {
      const all = localDb.getFollowUps();
      localDb.saveFollowUps(all.filter((f) => f.id !== id));
    }
  },
};
