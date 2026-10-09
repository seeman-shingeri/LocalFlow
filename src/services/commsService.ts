import { CommunicationLog, CommunicationChannel } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';

export interface LogCommunicationInput {
  workspace_id: string;
  customer_id: string;
  channel: CommunicationChannel;
  content: string;
  subject?: string;
  status?: 'draft' | 'sent' | 'logged';
}

export const commsService = {
  async getByCustomerId(customerId: string): Promise<CommunicationLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return localDb
        .getCommunications(customerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async logMessage(input: LogCommunicationInput): Promise<CommunicationLog> {
    const now = new Date().toISOString();
    const logItem: Omit<CommunicationLog, 'id'> = {
      workspace_id: input.workspace_id,
      customer_id: input.customer_id,
      channel: input.channel,
      direction: 'outbound',
      subject: input.subject || null,
      content: input.content,
      status: input.status || 'logged',
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('communication_logs').insert(logItem).select('*').single();
      if (error) throw error;

      // Update customer last contact date
      await supabase.from('customers').update({ last_contact_date: now }).eq('id', input.customer_id);
      return data;
    } else {
      const newLog: CommunicationLog = {
        ...logItem,
        id: `comm-${Date.now()}`,
      };
      const all = localDb.getCommunications();
      all.unshift(newLog);
      localDb.saveCommunications(all);

      // Update customer last contact date
      const customers = localDb.getCustomers();
      const idx = customers.findIndex((c) => c.id === input.customer_id);
      if (idx !== -1) {
        customers[idx].last_contact_date = now;
        localDb.saveCustomers(customers);
      }

      return newLog;
    }
  },
};
