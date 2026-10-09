import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Invoice, Customer } from '@/types/database';
import { invoiceService } from '@/services/invoiceService';
import { customerService } from '@/services/customerService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { calculateInvoiceTotals, formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
  defaultCustomerId?: string;
}

interface LineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCustomerId,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [taxRate, setTaxRate] = useState('8.25');
  const [notes, setNotes] = useState('Thank you for choosing our service!');
  const [terms, setTerms] = useState('Payment due within 14 days of issue date.');

  const [items, setItems] = useState<LineItemInput[]>([
    { description: 'Service Labor & Diagnosis', quantity: 1, unit_price: 150 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentWorkspace && isOpen) {
      customerService.getAll(currentWorkspace.id).then((c) => {
        setCustomers(c.filter((cust) => cust.status !== 'archived'));
        if (!customerId && c.length > 0) {
          setCustomerId(defaultCustomerId || c[0].id);
        }
      });
      invoiceService.getNextInvoiceNumber(currentWorkspace.id).then(setInvoiceNumber);
    }
  }, [currentWorkspace, isOpen, defaultCustomerId]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemInput, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotals(
    items,
    parseFloat(taxRate) || 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required.');
      return;
    }
    if (items.length === 0 || items.some((i) => !i.description.trim())) {
      setError('All line items must have a description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const saved = await invoiceService.create({
        workspace_id: currentWorkspace.id,
        customer_id: customerId,
        invoice_number: invoiceNumber.trim(),
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: parseFloat(taxRate) || 0,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        items: items.map((i) => ({
          description: i.description.trim(),
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
        })),
      });

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to generate invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Invoice"
      description="Generate an itemized invoice with subtotal, tax, and balance due."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Billed To (Customer) *"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Invoice Number *"
            required
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />

          <Input
            label="Issue Date *"
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />

          <Input
            label="Due Date *"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            label="Tax Rate (%)"
            type="number"
            step="0.01"
            min="0"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </div>

        {/* Dynamic Line Items Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Line Items
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-7 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2.5">
            {items.map((item, index) => {
              const lineTotal = Math.round(item.quantity * item.unit_price * 100) / 100;
              return (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50/80 p-2.5 rounded-lg border border-slate-200"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Item or service description *"
                      required
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      step="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      placeholder="Price"
                      min="0"
                      step="0.01"
                      required
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 text-right text-xs font-bold text-slate-800">
                    {formatCurrency(lineTotal, currentWorkspace?.currency)}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                      title="Remove line item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-2">
          <div className="w-full max-w-xs space-y-1.5 rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(subtotal, currentWorkspace?.currency)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({taxRate}%):</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(taxAmount, currentWorkspace?.currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
              <span>Total Amount:</span>
              <span className="text-indigo-600">
                {formatCurrency(totalAmount, currentWorkspace?.currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Textarea
            label="Notes to Customer"
            placeholder="Thank you for your business..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <Textarea
            label="Payment Terms"
            placeholder="Net 14 days. Settle via bank transfer or card..."
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
            Create & Issue Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
};
