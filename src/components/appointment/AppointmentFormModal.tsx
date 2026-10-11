import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Appointment, AppointmentStatus, Customer } from '@/types/database';
import { appointmentService } from '@/services/appointmentService';
import { customerService } from '@/services/customerService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { format, addMinutes } from 'date-fns';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  initialAppointment?: Appointment | null;
  defaultCustomerId?: string;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAppointment,
  defaultCustomerId,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState(format(new Date(), "yyyy-MM-dd'T'10:00"));
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Appointment[]>([]);
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
    if (!currentWorkspace || !isOpen || !startTime || status !== 'scheduled') {
      setConflicts([]);
      return;
    }
    const dur = parseInt(durationMinutes, 10) || 60;
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      setConflicts([]);
      return;
    }
    const end = addMinutes(start, dur);
    appointmentService
      .checkConflict(currentWorkspace.id, start.toISOString(), end.toISOString(), initialAppointment?.id)
      .then(setConflicts)
      .catch(() => setConflicts([]));
  }, [currentWorkspace, isOpen, startTime, durationMinutes, status, initialAppointment]);

  useEffect(() => {
    if (initialAppointment) {
      setCustomerId(initialAppointment.customer_id);
      setTitle(initialAppointment.title);
      try {
        setStartTime(format(new Date(initialAppointment.start_time), "yyyy-MM-dd'T'HH:mm"));
      } catch {
        setStartTime(initialAppointment.start_time);
      }
      setDurationMinutes(String(initialAppointment.duration_minutes));
      setLocation(initialAppointment.location || '');
      setStatus(initialAppointment.status);
      setNotes(initialAppointment.notes || '');
    } else {
      setTitle('');
      setStartTime(format(new Date(), "yyyy-MM-dd'T'10:00"));
      setDurationMinutes('60');
      setLocation('');
      setStatus('scheduled');
      setNotes('');
      if (defaultCustomerId) setCustomerId(defaultCustomerId);
    }
    setError(null);
  }, [initialAppointment, isOpen, defaultCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    if (!customerId) {
      setError('Please select a customer for this appointment.');
      return;
    }
    if (!title.trim()) {
      setError('Appointment title is required.');
      return;
    }
    if (!startTime) {
      setError('Start time is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const dur = parseInt(durationMinutes, 10) || 60;
      const start = new Date(startTime);
      const end = addMinutes(start, dur);

      let saved: Appointment;
      if (initialAppointment) {
        saved = await appointmentService.update(initialAppointment.id, {
          customer_id: customerId,
          title: title.trim(),
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_minutes: dur,
          location: location.trim() || null,
          status,
          notes: notes.trim() || null,
        });
      } else {
        saved = await appointmentService.create({
          workspace_id: currentWorkspace.id,
          customer_id: customerId,
          title: title.trim(),
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_minutes: dur,
          location: location.trim() || null,
          status,
          notes: notes.trim() || null,
        });
      }
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAppointment ? 'Edit Appointment' : 'Book New Service Appointment'}
      description="Schedule client on-site visit, consultation, or repair session."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p className="font-bold">Scheduling Conflict Warning:</p>
            <p className="mt-0.5">
              This time slot overlaps with {conflicts.length} existing scheduled appointment
              {conflicts.length > 1 ? 's' : ''} ({conflicts.map((c) => c.title).join(', ')}).
            </p>
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
                  {c.name} {c.address ? `• ${c.address}` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Service / Appointment Title *"
              required
              placeholder="e.g. Diagnostic Visit / System Installation / Duct Cleaning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <Input
            label="Date & Start Time *"
            type="datetime-local"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <Select
            label="Duration"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
          </Select>

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
          >
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </Select>

          <Input
            label="Location / Service Address"
            placeholder="Customer home or jobsite address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="sm:col-span-2">
            <Textarea
              label="Appointment Notes"
              placeholder="Access gate instructions, technician assignment, tools needed..."
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
            {initialAppointment ? 'Update Appointment' : 'Confirm Appointment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
