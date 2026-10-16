import React, { useState } from 'react';
import { Invoice } from '@/types/database';
import {
  calculateOutstandingAging,
  OutstandingAgingReport,
  AgingBucket,
  OutstandingInvoiceItem,
} from '@/lib/paymentAging';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Phone,
  Mail,
  User,
  CreditCard,
  CheckCircle2,
  Calendar,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import { generateInvoiceReminderMessage } from '@/lib/paymentReminderEngine';

interface OutstandingPaymentTrackerProps {
  invoices: Invoice[];
  currency?: string;
  onRecordPayment: (invoice: Invoice) => void;
  onViewCustomer?: (customerId: string) => void;
}

export const OutstandingPaymentTracker: React.FC<OutstandingPaymentTrackerProps> = ({
  invoices,
  currency = 'USD',
  onRecordPayment,
  onViewCustomer,
}) => {
  const [filterBucket, setFilterBucket] = useState<'all' | 'overdue_all' | AgingBucket>('all');
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  const report: OutstandingAgingReport = calculateOutstandingAging(invoices);

  const handleCopyReminder = (item: OutstandingInvoiceItem) => {
    const notice = generateInvoiceReminderMessage({
      invoice: item.invoice,
      customer: item.invoice.customer,
      daysOverdue: item.daysOverdue,
      currency,
    });
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(notice.body);
    }
    setCopiedInvoiceId(item.invoice.id);
    setTimeout(() => setCopiedInvoiceId(null), 2500);
  };

  const filteredItems = report.items.filter((item) => {
    if (filterBucket === 'all') return true;
    if (filterBucket === 'overdue_all') return item.daysOverdue > 0;
    return item.agingBucket === filterBucket;
  });

  const getBucketBadge = (bucket: AgingBucket, days: number) => {
    switch (bucket) {
      case 'current':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold">
            <Clock className="w-3 h-3 text-slate-400" /> Current / Not Due
          </span>
        );
      case '1-15':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> 1–15 Days ({days}d)
          </span>
        );
      case '16-30':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 px-2.5 py-0.5 text-xs font-bold">
            <AlertTriangle className="w-3 h-3 text-orange-600" /> 16–30 Days ({days}d)
          </span>
        );
      case '30+':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> 30+ Days Overdue ({days}d)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Aging Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="col-span-2 lg:col-span-1 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Receivables
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {formatCurrency(report.totalOutstanding, currency)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Across {report.items.length} pending statements
          </span>
        </div>

        <button
          onClick={() => setFilterBucket('current')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterBucket === 'current'
              ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Current (Not Due)
          </span>
          <span className="text-lg font-bold text-slate-800 mt-1 block">
            {formatCurrency(report.currentAmount, currency)}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Payment grace period</span>
        </button>

        <button
          onClick={() => setFilterBucket('1-15')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterBucket === '1-15'
              ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
            1–15 Days Overdue
          </span>
          <span className="text-lg font-bold text-amber-800 mt-1 block">
            {formatCurrency(report.overdue1to15Amount, currency)}
          </span>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Initial reminder</span>
        </button>

        <button
          onClick={() => setFilterBucket('16-30')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            filterBucket === '16-30'
              ? 'border-orange-600 bg-orange-50/50 ring-1 ring-orange-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 block">
            16–30 Days Overdue
          </span>
          <span className="text-lg font-bold text-orange-800 mt-1 block">
            {formatCurrency(report.overdue16to30Amount, currency)}
          </span>
          <span className="text-[10px] text-orange-600 font-medium mt-0.5 block">Follow-up needed</span>
        </button>

        <button
          onClick={() => setFilterBucket('30+')}
          className={`col-span-2 lg:col-span-1 p-3.5 rounded-xl border text-left transition-all ${
            filterBucket === '30+'
              ? 'border-rose-600 bg-rose-50/60 ring-1 ring-rose-500 shadow-xs'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
            30+ Days Overdue
          </span>
          <span className="text-lg font-bold text-rose-800 mt-1 block">
            {formatCurrency(report.overdue30PlusAmount, currency)}
          </span>
          <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">Critical Collection</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {[
            { id: 'all', label: `All Outstanding (${report.items.length})` },
            { id: 'overdue_all', label: `All Overdue (${report.totalOverdueCount})` },
            { id: '1-15', label: '1–15 Days' },
            { id: '16-30', label: '16–30 Days' },
            { id: '30+', label: '30+ Days Critical' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterBucket(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterBucket === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filterBucket !== 'all' && (
          <button
            onClick={() => setFilterBucket('all')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Tracker Records List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Outstanding Records in this Category</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            All customer accounts in this bucket have been completely settled.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const { invoice, daysOverdue, agingBucket } = item;
            const isSevere = agingBucket === '30+';
            const isOverdue = daysOverdue > 0;

            return (
              <div
                key={invoice.id}
                className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border bg-white shadow-2xs transition-all ${
                  isSevere
                    ? 'border-rose-300 bg-rose-50/20'
                    : isOverdue
                    ? 'border-amber-200 bg-amber-50/15'
                    : 'border-slate-200'
                }`}
              >
                {/* Customer and Invoice Details */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {invoice.invoice_number}
                    </span>
                    {getBucketBadge(agingBucket, daysOverdue)}
                    {invoice.status === 'partial' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Partially Paid
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {invoice.customer ? (
                      <button
                        type="button"
                        onClick={() => onViewCustomer && onViewCustomer(invoice.customer_id)}
                        className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {invoice.customer.name}
                      </button>
                    ) : (
                      <span className="font-semibold text-slate-700">Customer ID: {invoice.customer_id}</span>
                    )}

                    {invoice.customer?.phone && (
                      <a
                        href={`tel:${invoice.customer.phone}`}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                        title="Call customer"
                      >
                        <Phone className="w-3 h-3 text-slate-400" />
                        {invoice.customer.phone}
                      </a>
                    )}

                    {invoice.customer?.email && (
                      <a
                        href={`mailto:${invoice.customer.email}`}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                        title="Email customer"
                      >
                        <Mail className="w-3 h-3 text-slate-400" />
                        {invoice.customer.email}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>Issued: {formatDate(invoice.issue_date)}</span>
                    <span>•</span>
                    <span className={isOverdue ? 'text-rose-600 font-semibold' : ''}>
                      Due: {formatDate(invoice.due_date)}
                    </span>
                  </div>
                </div>

                {/* Amounts & Quick Collection */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Balance Due
                    </span>
                    <span className="text-lg font-black text-rose-600 block">
                      {formatCurrency(invoice.balance_due, currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Total: {formatCurrency(invoice.total_amount, currency)} (Paid: {formatCurrency(invoice.paid_amount, currency)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOverdue && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyReminder(item)}
                        className="shrink-0 text-slate-700 hover:text-indigo-600"
                        title="Copy formatted overdue reminder notice to clipboard"
                      >
                        {copiedInvoiceId === invoice.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy Notice
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onRecordPayment(invoice)}
                      className="shrink-0"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                      Record Payment
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
