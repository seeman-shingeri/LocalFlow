import { Invoice, InvoiceItem } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';
import { calculateInvoiceTotals, isDateOverdue } from '@/lib/utils';

export interface CreateInvoiceInput {
  workspace_id: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  tax_rate: number;
  status?: 'draft' | 'sent';
  notes?: string;
  terms?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const invoiceService = {
  async getAll(workspaceId: string, filter?: { status?: string; customerId?: string }): Promise<Invoice[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('invoices')
        .select('*, customer:customers(*), items:invoice_items(*), payments(*)')
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
      let invoices = localDb.getInvoices(workspaceId);
      const customers = localDb.getCustomers(workspaceId);
      const payments = localDb.getPayments(workspaceId);

      // Dynamically transition 'sent' invoices past due date to 'overdue', preserving 'draft' and 'partial'
      invoices = invoices.map((inv) => {
        let currentStatus = inv.status;
        if (currentStatus === 'sent' && isDateOverdue(inv.due_date)) {
          currentStatus = 'overdue';
        }
        return {
          ...inv,
          status: currentStatus,
          customer: customers.find((c) => c.id === inv.customer_id),
          payments: payments.filter((p) => p.invoice_id === inv.id),
        };
      });

      if (filter?.status && filter.status !== 'all') {
        if (filter.status === 'overdue') {
          invoices = invoices.filter(
            (i) => i.status === 'overdue' || (i.status === 'partial' && isDateOverdue(i.due_date))
          );
        } else {
          invoices = invoices.filter((i) => i.status === filter.status);
        }
      }
      if (filter?.customerId) {
        invoices = invoices.filter((i) => i.customer_id === filter.customerId);
      }

      return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  },

  async getById(id: string, workspaceId: string): Promise<Invoice | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*), items:invoice_items(*), payments(*)')
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .single();
      if (error) return null;
      return data;
    } else {
      const invoices = await this.getAll(workspaceId);
      return invoices.find((i) => i.id === id) || null;
    }
  },

  async getNextInvoiceNumber(workspaceId: string): Promise<string> {
    const invoices = await this.getAll(workspaceId);
    const year = new Date().getFullYear();
    const maxSeq = invoices.reduce((max, inv) => {
      const match = inv.invoice_number.match(/-(\d+)$/);
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, 0);
    const nextSeq = Math.max(invoices.length + 1, maxSeq + 1);
    return `INV-${year}-${String(nextSeq).padStart(3, '0')}`;
  },

  async create(input: CreateInvoiceInput): Promise<Invoice> {
    const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotals(input.items, input.tax_rate);
    const now = new Date().toISOString();
    const initialStatus = input.status || 'sent';

    if (isSupabaseConfigured && supabase) {
      const { data: inv, error } = await supabase
        .from('invoices')
        .insert({
          workspace_id: input.workspace_id,
          customer_id: input.customer_id,
          invoice_number: input.invoice_number,
          issue_date: input.issue_date,
          due_date: input.due_date,
          subtotal,
          tax_rate: input.tax_rate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          paid_amount: 0.00,
          balance_due: totalAmount,
          status: initialStatus,
          notes: input.notes || null,
          terms: input.terms || null,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();
      if (error) throw error;

      // Insert line items
      const itemsToInsert = input.items.map((item, idx) => ({
        invoice_id: inv.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: Math.round(item.quantity * item.unit_price * 100) / 100,
        sort_order: idx + 1,
      }));

      await supabase.from('invoice_items').insert(itemsToInsert);
      return (await this.getById(inv.id, input.workspace_id))!;
    } else {
      const invoiceId = `inv-${Date.now()}`;
      const lineItems: InvoiceItem[] = input.items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        invoice_id: invoiceId,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        line_total: Math.round(Number(item.quantity) * Number(item.unit_price) * 100) / 100,
        sort_order: idx + 1,
      }));

      const newInvoice: Invoice = {
        id: invoiceId,
        workspace_id: input.workspace_id,
        customer_id: input.customer_id,
        invoice_number: input.invoice_number,
        issue_date: input.issue_date,
        due_date: input.due_date,
        subtotal,
        tax_rate: input.tax_rate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        paid_amount: 0.00,
        balance_due: totalAmount,
        status: initialStatus,
        notes: input.notes || null,
        terms: input.terms || null,
        items: lineItems,
        payments: [],
        created_at: now,
        updated_at: now,
      };

      const all = localDb.getInvoices();
      all.unshift(newInvoice);
      localDb.saveInvoices(all);

      const customer = localDb.getCustomers().find((c) => c.id === input.customer_id);
      return { ...newInvoice, customer };
    }
  },

  async updateStatus(id: string, status: Invoice['status'], workspaceId: string): Promise<Invoice> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return (await this.getById(id, workspaceId))!;
    } else {
      const all = localDb.getInvoices();
      const idx = all.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error('Invoice not found');
      all[idx].status = status;
      all[idx].updated_at = new Date().toISOString();
      localDb.saveInvoices(all);
      return (await this.getById(id, workspaceId))!;
    }
  },

  async delete(id: string, workspaceId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('invoices').delete().eq('id', id).eq('workspace_id', workspaceId);
      if (error) throw error;
    } else {
      const all = localDb.getInvoices();
      localDb.saveInvoices(all.filter((i) => i.id !== id));
      // Delete associated payments
      const payments = localDb.getPayments();
      localDb.savePayments(payments.filter((p) => p.invoice_id !== id));
    }
  },
};
