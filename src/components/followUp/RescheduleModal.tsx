import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { FollowUp } from '@/types/database';
import { followUpService } from '@/services/followUpService';
import { format, addDays } from 'date-fns';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUp | null;
  onSuccess: (updated: FollowUp) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  followUp,
  onSuccess,
}) => {
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'10:00"));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await followUpService.reschedule(
        followUp.id,
        new Date(dueDate).toISOString(),
        notes.trim()
      );
      onSuccess(updated);
      onClose();
    } catch {
      // error handled
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddDays = (days: number) => {
    setDueDate(format(addDays(new Date(), days), "yyyy-MM-dd'T'10:00"));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Follow-up"
      description={`Postpone or select a new contact time for ${followUp.customer?.name || 'customer'}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Quick Reschedule Options
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAddDays(1)}>
              Tomorrow
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAddDays(3)}>
              In 3 Days
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleQuickAddDays(7)}>
              Next Week
            </Button>
          </div>
        </div>

        <Input
          label="New Due Date & Time *"
          type="datetime-local"
          required
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <Textarea
          label="Reschedule Reason / Note"
          placeholder="e.g. Customer requested call after 4 PM; left voicemail..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={submitting}>
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
};
