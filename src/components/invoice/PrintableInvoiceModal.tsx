import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Invoice } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Printer, Download, CheckCircle2 } from 'lucide-react';

interface PrintableInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { currentWorkspace } = useWorkspace();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice ${invoice.invoice_number}`}
      description="Printable business invoice statement."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Print Toolbar */}
        <div className="flex justify-end gap-2 no-print border-b border-slate-100 pb-3">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Print / Save as PDF
          </Button>
        </div>

        {/* Invoice Printable Sheet */}
        <div id="printable-invoice" className="p-6 bg-white border border-slate-200 rounded-xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {currentWorkspace?.name || 'LocalFlow Business'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">{currentWorkspace?.category}</p>
              {currentWorkspace?.address && (
                <p className="text-xs text-slate-500 mt-0.5">{currentWorkspace.address}</p>
              )}
              {currentWorkspace?.phone && (
                <p className="text-xs text-slate-500 mt-0.5">{currentWorkspace.phone}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <h2 className="text-xl font-bold uppercase tracking-wider text-indigo-600">INVOICE</h2>
              <p className="text-sm font-bold text-slate-900 mt-1">{invoice.invoice_number}</p>
              <p className="text-xs text-slate-500 mt-0.5">Date: {formatDate(invoice.issue_date)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Due: {formatDate(invoice.due_date)}</p>
              <div className="mt-2">
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded uppercase ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : invoice.status === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : invoice.status === 'overdue'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Status: {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">BILLED TO</p>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{invoice.customer?.name}</h3>
              {invoice.customer?.email && <p className="text-slate-600 mt-0.5">{invoice.customer.email}</p>}
              {invoice.customer?.phone && <p className="text-slate-600 mt-0.5">{invoice.customer.phone}</p>}
              {invoice.customer?.address && <p className="text-slate-600 mt-0.5">{invoice.customer.address}</p>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-600">
                        {formatCurrency(item.unit_price, currentWorkspace?.currency)}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {formatCurrency(item.line_total, currentWorkspace?.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      Standard Service Order
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculations / Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(invoice.subtotal, currentWorkspace?.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({invoice.tax_rate}%):</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(invoice.tax_amount, currentWorkspace?.currency)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-100 pt-2">
                <span>Total Amount:</span>
                <span className="text-slate-900">
                  {formatCurrency(invoice.total_amount, currentWorkspace?.currency)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Amount Paid:</span>
                <span>- {formatCurrency(invoice.paid_amount, currentWorkspace?.currency)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base border-t-2 border-slate-900 pt-2 text-indigo-700">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balance_due, currentWorkspace?.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment History Log if any */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border-t border-slate-200 pt-4 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                Recorded Payments
              </h4>
              <div className="space-y-1.5">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(p.amount, currentWorkspace?.currency)}
                      </span>{' '}
                      via <span className="uppercase">{p.payment_method}</span>
                      {p.transaction_reference && (
                        <span className="text-slate-400 text-[11px] ml-1">({p.transaction_reference})</span>
                      )}
                    </div>
                    <span className="text-slate-500">{formatDate(p.payment_date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes and Terms */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-2">
            {invoice.notes && (
              <p>
                <strong>Notes:</strong> {invoice.notes}
              </p>
            )}
            {invoice.terms && (
              <p>
                <strong>Terms:</strong> {invoice.terms}
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
