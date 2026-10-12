import React, { useState, useEffect } from 'react';
import { Invoice } from '@/types/database';
import { invoiceService } from '@/services/invoiceService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { InvoiceList } from '@/components/invoice/InvoiceList';
import { InvoiceFormModal } from '@/components/invoice/InvoiceFormModal';
import { RecordPaymentModal } from '@/components/invoice/RecordPaymentModal';
import { PrintableInvoiceModal } from '@/components/invoice/PrintableInvoiceModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomerDetailDrawer } from '@/components/customer/CustomerDetailDrawer';
import { Button } from '@/components/ui/Button';
import { formatCurrency, exportToCsv } from '@/lib/utils';
import { Receipt, Plus, Filter, DollarSign, Clock, CheckCircle2, Download } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);
  const [printTargetInvoice, setPrintTargetInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Customer drawer
  const [drawerCustomerId, setDrawerCustomerId] = useState<string | null>(null);

  const loadInvoices = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const data = await invoiceService.getAll(currentWorkspace.id, {
        status: statusFilter,
      });
      setInvoices(data);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentWorkspace, statusFilter]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentWorkspace) return;
    setDeleting(true);
    try {
      await invoiceService.delete(deleteTarget.id, currentWorkspace.id);
      setDeleteTarget(null);
      loadInvoices();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, status: Invoice['status']) => {
    if (!currentWorkspace) return;
    try {
      await invoiceService.updateStatus(id, status, currentWorkspace.id);
      loadInvoices();
    } catch {
      // ignore
    }
  };

  const handleExportCsv = () => {
    if (invoices.length === 0) return;
    exportToCsv(
      `invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Invoice Number',
        'Customer',
        'Status',
        'Issue Date',
        'Due Date',
        'Subtotal',
        'Tax Amount',
        'Total Amount',
        'Paid Amount',
        'Balance Due',
      ],
      invoices.map((inv) => [
        inv.invoice_number,
        inv.customer?.name || '',
        inv.status,
        inv.issue_date,
        inv.due_date,
        inv.subtotal,
        inv.tax_amount,
        inv.total_amount,
        inv.paid_amount,
        inv.balance_due,
      ])
    );
  };

  // Financial calculations across active issued invoices (excluding cancelled and draft)
  const totalBilled = invoices
    .filter((i) => i.status !== 'cancelled' && i.status !== 'draft')
    .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalCollected = invoices
    .filter((i) => i.status !== 'cancelled')
    .reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0);
  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft')
    .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoices & Payments</h1>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {invoices.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage billable services, log partial or full customer payments, and track receivables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
            >
              <option value="all">All Invoices</option>
              <option value="sent">Sent / Unpaid</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Fully Paid</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Drafts</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={invoices.length === 0}
            title="Export filtered invoices to CSV"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>

          <Button variant="primary" size="sm" onClick={() => setFormModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Invoiced
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalBilled, currentWorkspace?.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Across all issued statements</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Total Payments Collected
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(totalCollected, currentWorkspace?.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Recorded cash, card, and bank receipts</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            Outstanding Receivables
          </p>
          <p className="text-xl font-bold text-rose-700 mt-1">
            {formatCurrency(totalOutstanding, currentWorkspace?.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Pending collection from clients</p>
        </div>
      </div>

      {/* Invoices List */}
      <InvoiceList
        invoices={invoices}
        onRecordPayment={(inv) => setPaymentTargetInvoice(inv)}
        onStatusChange={handleStatusChange}
        onViewPrint={(inv) => setPrintTargetInvoice(inv)}
        onDelete={(inv) => setDeleteTarget(inv)}
        onViewCustomer={(cid) => setDrawerCustomerId(cid)}
      />

      {/* Modals */}
      <InvoiceFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={() => loadInvoices()}
      />

      <RecordPaymentModal
        isOpen={Boolean(paymentTargetInvoice)}
        onClose={() => setPaymentTargetInvoice(null)}
        invoice={paymentTargetInvoice}
        onSuccess={() => loadInvoices()}
      />

      <PrintableInvoiceModal
        isOpen={Boolean(printTargetInvoice)}
        onClose={() => setPrintTargetInvoice(null)}
        invoice={printTargetInvoice}
      />

      <CustomerDetailDrawer
        customerId={drawerCustomerId}
        onClose={() => setDrawerCustomerId(null)}
        onCustomerUpdated={() => loadInvoices()}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteTarget?.invoice_number}"?`}
        confirmText="Delete Invoice"
        isLoading={deleting}
      />
    </div>
  );
};
