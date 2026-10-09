import { Payment, PaymentMethod } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localDb } from '@/lib/localStorageDb';
import { invoiceService } from './invoiceService';

export interface RecordPaymentInput {
  workspace_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  notes?: string;
}

export const paymentService = {
  async getAll(workspaceId: string): Promise<Payment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return localDb.getPayments(workspaceId).sort(
        (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
    }
  },

  async recordPayment(input: RecordPaymentInput): Promise<Payment> {
    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      // 1. Insert payment record (our PostgreSQL trigger automatically updates invoice paid_amount, balance_due, and status)
      const { data, error } = await supabase
        .from('payments')
        .insert({
          workspace_id: input.workspace_id,
          invoice_id: input.invoice_id,
          customer_id: input.customer_id,
          amount,
          payment_method: input.payment_method,
          transaction_reference: input.transaction_reference || null,
          notes: input.notes || null,
          payment_date: now,
          created_at: now,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    } else {
      // Local ledger logic
      const invoices = localDb.getInvoices(input.workspace_id);
      const invoiceIndex = invoices.findIndex((i) => i.id === input.invoice_id);
      if (invoiceIndex === -1) {
        throw new Error('Invoice not found');
      }

      const invoice = invoices[invoiceIndex];
      const newPaidAmount = Math.round((invoice.paid_amount + amount) * 100) / 100;
      const newBalanceDue = Math.max(0, Math.round((invoice.total_amount - newPaidAmount) * 100) / 100);

      let newStatus = invoice.status;
      if (newPaidAmount >= invoice.total_amount) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
      }

      invoice.paid_amount = newPaidAmount;
      invoice.balance_due = newBalanceDue;
      invoice.status = newStatus;
      invoice.updated_at = now;

      const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        workspace_id: input.workspace_id,
        invoice_id: input.invoice_id,
        customer_id: input.customer_id,
        amount,
        payment_date: now,
        payment_method: input.payment_method,
        transaction_reference: input.transaction_reference || null,
        notes: input.notes || null,
        created_at: now,
      };

      const allPayments = localDb.getPayments();
      allPayments.unshift(newPayment);
      localDb.savePayments(allPayments);

      invoices[invoiceIndex] = invoice;
      localDb.saveInvoices(invoices);

      return newPayment;
    }
  },
};
