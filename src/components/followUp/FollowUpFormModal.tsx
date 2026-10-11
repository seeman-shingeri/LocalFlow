import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FollowUp, PriorityLevel, Customer, Enquiry } from '@/types/database';
import { followUpService } from '@/services/followUpService';
import { customerService } from '@/services/customerService';
import { enquiryService } from '@/services/enquiryService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { format } from 'date-fns';

interface FollowUpFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (followUp: FollowUp) => void;
  initialFollowUp?: FollowUp | null;
  defaultCustomerId?: string;
}

export const FollowUpFormModal: React.FC<FollowUpFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialFollowUp,
  defaultCustomerId,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [enquiryId, setEnquiryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd'T'14:00"));
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
      enquiryService.getAll(currentWorkspace.id).then(setEnquiries);
    }
  }, [currentWorkspace, isOpen, defaultCustomerId]);

  useEffect(() => {
    if (initialFollowUp) {
      setCustomerId(initialFollowUp.customer_id);
      setEnquiryId(initialFollowUp.enquiry_id || '');
      setTitle(initialFollowUp.title);
      try {
        setDueDate(format(new Date(initialFollowUp.due_date), "yyyy-MM-dd'T'HH:mm"));
      } catch {
        setDueDate(initialFollowUp.due_date);
      }
      setPriority(initialFollowUp.priority);
      setNotes(initialFollowUp.notes || '');
    } else {
      setTitle('');
      setEnquiryId('');
      setDueDate(format(new Date(), "yyyy-MM-dd'T'14:00"));
      setPriority('medium');
      setNotes('');
      if (defaultCustomerId) setCustomerId(defaultCustomerId);
    }
    setError(null);
  }, [initialFollowUp, isOpen, defaultCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    if (!customerId) {
      setError('Please select a customer for this follow-up.');
      return;
    }
    if (!title.trim()) {
      setError('Follow-up title or task is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isoDueDate = new Date(dueDate).toISOString();
      let saved: FollowUp;
      if (initialFollowUp) {
        saved = await followUpService.update(initialFollowUp.id, {
          customer_id: customerId,
          enquiry_id: enquiryId || null,
          title: title.trim(),
          due_date: isoDueDate,
          priority,
          notes: notes.trim() || null,
        });
      } else {
        saved = await followUpService.create({
          workspace_id: currentWorkspace.id,
          customer_id: customerId,
          enquiry_id: enquiryId || null,
          title: title.trim(),
          due_date: isoDueDate,
          status: 'pending',
          priority,
          notes: notes.trim() || null,
        });
      }
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save follow-up.');
    } finally {
      setSubmitting(false);
    }
  };

  const customerEnquiries = enquiries.filter((e) => e.customer_id === customerId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialFollowUp ? 'Edit Follow-up Task' : 'Schedule Customer Follow-up'}
      description="Set a date and reminder to contact a customer or advance an enquiry."
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
              label="Follow-up Action / Title *"
              required
              placeholder="e.g. Call to confirm quote acceptance / Check in regarding unit performance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <Input
            label="Due Date & Time *"
            type="datetime-local"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority (Urgent)</option>
          </Select>

          {customerEnquiries.length > 0 && (
            <div className="sm:col-span-2">
              <Select
                label="Related Enquiry (Optional)"
                value={enquiryId}
                onChange={(e) => setEnquiryId(e.target.value)}
              >
                <option value="">None (General Customer Follow-up)</option>
                {customerEnquiries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="sm:col-span-2">
            <Textarea
              label="Task Notes"
              placeholder="Context notes, talking points, special instructions..."
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
            {initialFollowUp ? 'Update Follow-up' : 'Schedule Follow-up'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
