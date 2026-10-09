import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Invoice, PaymentMethod } from '@/types/database';
import { paymentService } from '@/services/paymentService';
import { formatCurrency } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [amount, setAmount] = useState<string>(invoice ? String(invoice.balance_due) : '0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (invoice) {
      setAmount(String(invoice.balance_due));
      setError(null);
      setReference('');
      setNotes('');
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handlePayFull = () => {
    setAmount(String(invoice.balance_due));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (numAmount > invoice.balance_due + 0.01) {
      setError(`Payment cannot exceed the outstanding balance of ${formatCurrency(invoice.balance_due, currentWorkspace.currency)}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await paymentService.recordPayment({
        workspace_id: currentWorkspace.id,
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        amount: numAmount,
        payment_method: paymentMethod,
        transaction_reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoice_number}`}
      description={`Customer: ${invoice.customer?.name || 'Customer'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Balance Due Card */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs">
          <div>
            <p className="text-slate-500">Current Outstanding Balance</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {formatCurrency(invoice.balance_due, currentWorkspace?.currency)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handlePayFull}>
            Pay In Full
          </Button>
        </div>

        <Input
          label="Payment Amount *"
          type="number"
          min="0.01"
          max={String(invoice.balance_due)}
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Select
          label="Payment Method *"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          <option value="card">Credit / Debit Card</option>
          <option value="bank_transfer">Bank Transfer / ACH / Wire</option>
          <option value="cash">Cash</option>
          <option value="other">Check / Other</option>
        </Select>

        <Input
          label="Transaction Reference / Check #"
          placeholder="e.g. STRIPE_TXN_00293 or Check #1042"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <Textarea
          label="Payment Notes"
          placeholder="Additional notes for receipt..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
