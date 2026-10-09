import React from 'react';
import { Appointment, AppointmentStatus } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatTimeOnly } from '@/lib/utils';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Edit, Trash2, User } from 'lucide-react';

interface AppointmentListProps {
  appointments: Appointment[];
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onViewCustomer?: (customerId: string) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  onStatusChange,
  onEdit,
  onDelete,
  onViewCustomer,
}) => {
  if (appointments.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <p className="text-xs text-slate-500">No appointments scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((item) => {
        const isScheduled = item.status === 'scheduled';
        const isCompleted = item.status === 'completed';
        const isCancelled = item.status === 'cancelled';

        return (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition-all"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h4>
                <Badge
                  variant={
                    isCompleted
                      ? 'success'
                      : isCancelled
                      ? 'danger'
                      : item.status === 'rescheduled'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {item.status}
                </Badge>
                <span className="rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-semibold">
                  {item.duration_minutes} mins
                </span>
              </div>

              {/* Time and Customer */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  {formatDateTime(item.start_time)}
                </span>

                {item.customer && (
                  <button
                    type="button"
                    onClick={() => onViewCustomer && onViewCustomer(item.customer_id)}
                    className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                  >
                    <User className="w-3 h-3 text-slate-400" />
                    {item.customer.name}
                  </button>
                )}

                {item.location && (
                  <span className="flex items-center gap-1 text-slate-500 truncate max-w-xs">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </span>
                )}
              </div>

              {item.notes && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-md p-2 mt-1">
                  {item.notes}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0 self-end sm:self-center shrink-0">
              {isScheduled && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(item.id, 'completed')}
                    className="text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                    title="Mark appointment as completed"
                  >
                    <CheckCircle className="w-3.5 h-3.5 sm:mr-1 text-emerald-600" />
                    <span className="hidden sm:inline">Complete</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(item.id, 'cancelled')}
                    className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                    title="Cancel appointment"
                  >
                    <XCircle className="w-3.5 h-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </>
              )}

              <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Edit appointment">
                <Edit className="w-4 h-4 text-slate-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(item)} title="Delete appointment">
                <Trash2 className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
