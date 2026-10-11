import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus } from '@/types/database';
import { appointmentService } from '@/services/appointmentService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { AppointmentList } from '@/components/appointment/AppointmentList';
import { AppointmentFormModal } from '@/components/appointment/AppointmentFormModal';
import { CustomerDetailDrawer } from '@/components/customer/CustomerDetailDrawer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button } from '@/components/ui/Button';
import { Calendar, Plus, Filter } from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Customer drawer
  const [drawerCustomerId, setDrawerCustomerId] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const data = await appointmentService.getAll(currentWorkspace.id, {
        status: statusFilter,
      });
      setAppointments(data);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentWorkspace, statusFilter]);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await appointmentService.updateStatus(id, status);
      loadAppointments();
    } catch {
      // ignore
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentWorkspace) return;
    setDeleting(true);
    try {
      await appointmentService.delete(deleteTarget.id, currentWorkspace.id);
      setDeleteTarget(null);
      loadAppointments();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Appointments</h1>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {appointments.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scheduled customer site visits, diagnostics, and repairs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
            >
              <option value="all">All Appointments</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingAppointment(null);
              setFormModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Appointment list */}
      <AppointmentList
        appointments={appointments}
        onStatusChange={handleStatusChange}
        onEdit={(apt) => {
          setEditingAppointment(apt);
          setFormModalOpen(true);
        }}
        onDelete={(apt) => setDeleteTarget(apt)}
        onViewCustomer={(cid) => setDrawerCustomerId(cid)}
      />

      {/* Modals */}
      <AppointmentFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingAppointment(null);
        }}
        onSuccess={() => loadAppointments()}
        initialAppointment={editingAppointment}
      />

      <CustomerDetailDrawer
        customerId={drawerCustomerId}
        onClose={() => setDrawerCustomerId(null)}
        onCustomerUpdated={() => loadAppointments()}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Appointment"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  );
};
