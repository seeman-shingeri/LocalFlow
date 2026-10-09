import React from 'react';
import { Invoice } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Printer, Trash2, User, Eye } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';

interface InvoiceListProps {
  invoices: Invoice[];
  onRecordPayment: (invoice: Invoice) => void;
  onViewPrint: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onViewCustomer?: (customerId: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onRecordPayment,
  onViewPrint,
  onDelete,
  onViewCustomer,
}) => {
  const { currentWorkspace } = useWorkspace();

  if (invoices.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <p className="text-xs text-slate-500">No invoices found matching criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4">Invoice #</th>
            <th className="py-3 px-4">Customer</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4 text-right">Total</th>
            <th className="py-3 px-4 text-right">Paid</th>
            <th className="py-3 px-4 text-right">Balance Due</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((inv) => {
            const hasBalance = inv.balance_due > 0;

            return (
              <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{inv.invoice_number}</td>

                <td className="py-3 px-4">
                  {inv.customer ? (
                    <button
                      type="button"
                      onClick={() => onViewCustomer && onViewCustomer(inv.customer_id)}
                      className="font-medium text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <User className="w-3 h-3 text-slate-400" />
                      {inv.customer.name}
                    </button>
                  ) : (
                    <span className="text-slate-400">Customer</span>
                  )}
                </td>

                <td className="py-3 px-4 text-slate-600">{formatDate(inv.due_date)}</td>

                <td className="py-3 px-4 text-right font-medium text-slate-900">
                  {formatCurrency(inv.total_amount, currentWorkspace?.currency)}
                </td>

                <td className="py-3 px-4 text-right font-medium text-emerald-700">
                  {formatCurrency(inv.paid_amount, currentWorkspace?.currency)}
                </td>

                <td
                  className={`py-3 px-4 text-right font-bold ${
                    hasBalance ? 'text-rose-600' : 'text-slate-400'
                  }`}
                >
                  {formatCurrency(inv.balance_due, currentWorkspace?.currency)}
                </td>

                <td className="py-3 px-4 text-center">
                  <Badge
                    variant={
                      inv.status === 'paid'
                        ? 'success'
                        : inv.status === 'partial'
                        ? 'warning'
                        : inv.status === 'overdue'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {inv.status}
                  </Badge>
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {hasBalance && inv.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRecordPayment(inv)}
                        className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        title="Record payment"
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Record Pay
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewPrint(inv)}
                      title="View & Print invoice"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(inv)}
                      title="Delete invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
