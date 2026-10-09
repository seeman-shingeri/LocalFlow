import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Customer, CustomerSource, CustomerStatus } from '@/types/database';
import { customerService } from '@/services/customerService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { AlertCircle } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  initialCustomer?: Customer | null;
}

const SOURCES: CustomerSource[] = ['Direct', 'Website', 'Referral', 'Google', 'Social Media', 'Walk-in', 'Other'];

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomer,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<CustomerSource>('Direct');
  const [status, setStatus] = useState<CustomerStatus>('active');

  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialCustomer) {
      setName(initialCustomer.name || '');
      setEmail(initialCustomer.email || '');
      setPhone(initialCustomer.phone || '');
      setAddress(initialCustomer.address || '');
      setNotes(initialCustomer.notes || '');
      setSource((initialCustomer.source as CustomerSource) || 'Direct');
      setStatus(initialCustomer.status || 'active');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
      setSource('Direct');
      setStatus('active');
    }
    setError(null);
    setDuplicateWarning(null);
  }, [initialCustomer, isOpen]);

  // Check duplicate on blur
  const handleCheckDuplicate = async () => {
    if (!currentWorkspace || (!email && !phone)) return;
    try {
      const dup = await customerService.checkDuplicate(
        currentWorkspace.id,
        email,
        phone,
        initialCustomer?.id
      );
      if (dup) {
        setDuplicateWarning(`A customer named "${dup.name}" already has this ${email === dup.email ? 'email' : 'phone number'}.`);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Non-fatal
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    if (!name.trim()) {
      setError('Customer name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let savedCustomer: Customer;
      if (initialCustomer) {
        savedCustomer = await customerService.update(initialCustomer.id, {
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          source,
          status,
        });
      } else {
        savedCustomer = await customerService.create({
          workspace_id: currentWorkspace.id,
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          source,
          status,
          last_contact_date: null,
          next_follow_up_date: null,
        });
      }

      onSuccess(savedCustomer);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCustomer ? 'Edit Customer' : 'Add New Customer'}
      description="Enter customer details to track inquiries, appointments, and invoices."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {duplicateWarning && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Full Name *"
              required
              placeholder="e.g. Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="sarah@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleCheckDuplicate}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={handleCheckDuplicate}
          />

          <Select
            label="Acquisition Source"
            value={source}
            onChange={(e) => setSource(e.target.value as CustomerSource)}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            label="Customer Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CustomerStatus)}
          >
            <option value="active">Active Customer</option>
            <option value="lead">Prospective Lead</option>
            <option value="archived">Archived</option>
          </Select>

          <div className="sm:col-span-2">
            <Input
              label="Service Address"
              placeholder="123 Maple St, Suite 4, Austin, TX"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <Textarea
              label="Internal Notes"
              placeholder="Special equipment details, gate access code, customer preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
            {initialCustomer ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
