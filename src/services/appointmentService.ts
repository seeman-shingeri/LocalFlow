import { Appointment, AppointmentStatus } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';

export const appointmentService = {
  async getAll(workspaceId: string, filter?: { status?: string; customerId?: string }): Promise<Appointment[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('appointments')
        .select('*, customer:customers(*)')
        .eq('workspace_id', workspaceId);

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.customerId) {
        query = query.eq('customer_id', filter.customerId);
      }

      query = query.order('start_time', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      let appointments = localDb.getAppointments(workspaceId);
      const customers = localDb.getCustomers(workspaceId);

      if (filter?.status && filter.status !== 'all') {
        appointments = appointments.filter((a) => a.status === filter.status);
      }
      if (filter?.customerId) {
        appointments = appointments.filter((a) => a.customer_id === filter.customerId);
      }

      return appointments
        .map((a) => ({
          ...a,
          customer: customers.find((c) => c.id === a.customer_id),
        }))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
  },

  async create(appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          created_at: now,
          updated_at: now,
        })
        .select('*, customer:customers(*)')
        .single();
      if (error) throw error;
      return data;
    } else {
      const all = localDb.getAppointments();
      const newApt: Appointment = {
        ...appointmentData,
        id: `apt-${Date.now()}`,
        created_at: now,
        updated_at: now,
      };
      all.push(newApt);
      localDb.saveAppointments(all);

      const customer = localDb.getCustomers().find((c) => c.id === appointmentData.customer_id);
      return { ...newApt, customer };
    }
  },

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('appointments')
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
      const all = localDb.getAppointments();
      const idx = all.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Appointment not found');

      const updated = {
        ...all[idx],
        ...updates,
        updated_at: now,
      };
      all[idx] = updated;
      localDb.saveAppointments(all);

      const customer = localDb.getCustomers().find((c) => c.id === updated.customer_id);
      return { ...updated, customer };
    }
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return this.update(id, { status });
  },

  async checkConflict(
    workspaceId: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<Appointment[]> {
    const scheduled = await this.getAll(workspaceId, { status: 'scheduled' });
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    return scheduled.filter((apt) => {
      if (excludeId && apt.id === excludeId) return false;
      const aptStart = new Date(apt.start_time).getTime();
      const aptEnd = new Date(apt.end_time).getTime();
      return startMs < aptEnd && endMs > aptStart;
    });
  },

  async delete(id: string, workspaceId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('appointments').delete().eq('id', id).eq('workspace_id', workspaceId);
      if (error) throw error;
    } else {
      const all = localDb.getAppointments();
      localDb.saveAppointments(all.filter((a) => a.id !== id));
    }
  },
};
