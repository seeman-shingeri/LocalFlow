import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Enquiry, EnquiryStatus, PriorityLevel, Customer } from '@/types/database';
import { enquiryService } from '@/services/enquiryService';
import { customerService } from '@/services/customerService';
import { useWorkspace } from '@/context/WorkspaceContext';

interface EnquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (enquiry: Enquiry) => void;
  initialEnquiry?: Enquiry | null;
  defaultCustomerId?: string;
}

export const EnquiryFormModal: React.FC<EnquiryFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEnquiry,
  defaultCustomerId,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('0');
  const [status, setStatus] = useState<EnquiryStatus>('new');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState('');

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
    }
  }, [currentWorkspace, isOpen, defaultCustomerId]);

  useEffect(() => {
    if (initialEnquiry) {
      setCustomerId(initialEnquiry.customer_id);
      setTitle(initialEnquiry.title);
      setServiceType(initialEnquiry.service_type || '');
      setEstimatedValue(String(initialEnquiry.estimated_value));
      setStatus(initialEnquiry.status);
      setPriority(initialEnquiry.priority);
      setNotes(initialEnquiry.notes || '');
    } else {
      setTitle('');
      setServiceType('');
      setEstimatedValue('0');
      setStatus('new');
      setPriority('medium');
      setNotes('');
      if (defaultCustomerId) setCustomerId(defaultCustomerId);
    }
    setError(null);
  }, [initialEnquiry, isOpen, defaultCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    if (!customerId) {
      setError('Please select a customer for this enquiry.');
      return;
    }
    if (!title.trim()) {
      setError('Enquiry title or description is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const val = parseFloat(estimatedValue) || 0;
      let saved: Enquiry;
      if (initialEnquiry) {
        saved = await enquiryService.update(initialEnquiry.id, {
          customer_id: customerId,
          title: title.trim(),
          service_type: serviceType.trim() || null,
          estimated_value: val,
          status,
          priority,
          notes: notes.trim() || null,
        });
      } else {
        saved = await enquiryService.create({
          workspace_id: currentWorkspace.id,
          customer_id: customerId,
          title: title.trim(),
          service_type: serviceType.trim() || null,
          estimated_value: val,
          status,
          priority,
          notes: notes.trim() || null,
        });
      }
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialEnquiry ? 'Edit Enquiry' : 'New Service Enquiry'}
      description="Track potential business opportunity, estimated value, and deal stage."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Customer *"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Enquiry Title *"
              required
              placeholder="e.g. Full HVAC Installation / Diagnostic Check"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <Input
            label="Service Category"
            placeholder="e.g. Repair, Maintenance, Installation"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          />

          <Input
            label="Estimated Value ($)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />

          <Select
            label="Pipeline Stage"
            value={status}
            onChange={(e) => setStatus(e.target.value as EnquiryStatus)}
          >
            <option value="new">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested / Quote Sent</option>
            <option value="converted">Converted (Won)</option>
            <option value="not_converted">Not Converted (Lost)</option>
          </Select>

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority (Urgent)</option>
          </Select>

          <div className="sm:col-span-2">
            <Textarea
              label="Enquiry Notes"
              placeholder="Customer requirements, schedule timeline, quote details..."
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
            {initialEnquiry ? 'Update Enquiry' : 'Create Enquiry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
