import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types/database';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { formatTimeOnly, formatDateTime } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function getCalendarDaysForMonth(monthDate: Date): Date[] {
  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  return eachDayOfInterval({ start, end });
}

export function getBookingsForDay(appointments: Appointment[], day: Date): Appointment[] {
  return appointments.filter((apt) => {
    try {
      return isSameDay(parseISO(apt.start_time), day);
    } catch {
      return false;
    }
  });
}

interface EventBookingCalendarProps {
  appointments: Appointment[];
  onBookOnDate: (date: Date) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onViewCustomer?: (customerId: string) => void;
}

export const EventBookingCalendar: React.FC<EventBookingCalendarProps> = ({
  appointments,
  onBookOnDate,
  onEdit,
  onDelete,
  onStatusChange,
  onViewCustomer,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const days = getCalendarDaysForMonth(currentMonth);
  const selectedDayBookings = getBookingsForDay(appointments, selectedDate);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const getEventBadgeClass = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      case 'rescheduled':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Month Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <p className="text-xs text-slate-400">
                Shamiyana tent setups, event bookings & service appointments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs font-semibold">
              Today
            </Button>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:shadow-2xs transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:shadow-2xs transition-all"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-bold text-slate-500 py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month Grid Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100">
          {days.map((day) => {
            const dayBookings = getBookingsForDay(appointments, day);
            const inMonth = isSameMonth(day, currentMonth);
            const isDayToday = isToday(day);
            const isDaySelected = isSameDay(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[96px] sm:min-h-[110px] p-1.5 sm:p-2 cursor-pointer transition-all flex flex-col justify-between ${
                  !inMonth
                    ? 'bg-slate-50/60 text-slate-300'
                    : isDaySelected
                    ? 'bg-indigo-50/50 ring-2 ring-indigo-500 ring-inset z-10'
                    : 'bg-white hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isDayToday
                        ? 'bg-indigo-600 text-white'
                        : isDaySelected
                        ? 'text-indigo-700 font-extrabold'
                        : inMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayBookings.length > 0 && inMonth && (
                    <span className="text-[10px] font-bold text-indigo-600 px-1 rounded bg-indigo-50">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Day Events Preview Chips */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {dayBookings.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border truncate ${getEventBadgeClass(
                        apt.status
                      )}`}
                      title={`${apt.title} (${formatTimeOnly(apt.start_time)})`}
                    >
                      <span className="font-mono text-[9px] mr-1">{formatTimeOnly(apt.start_time)}</span>
                      <span>{apt.title}</span>
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <span className="text-[10px] font-medium text-slate-400 pl-1 block">
                      +{dayBookings.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda & Quick Booking Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Agenda for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedDayBookings.length === 0
                ? 'No events or equipment deliveries scheduled on this date.'
                : `${selectedDayBookings.length} event booking${selectedDayBookings.length > 1 ? 's' : ''} scheduled.`}
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onBookOnDate(selectedDate)}
            className="self-start sm:self-center"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Book Event on {format(selectedDate, 'MMM d')}
          </Button>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">Free Day — No Conflicting Bookings</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Shamiyana inventory and setup crew are completely available.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayBookings.map((apt) => {
              const isScheduled = apt.status === 'scheduled';
              const isCompleted = apt.status === 'completed';

              return (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{apt.title}</h4>
                      <Badge
                        variant={
                          isCompleted
                            ? 'success'
                            : apt.status === 'cancelled'
                            ? 'danger'
                            : apt.status === 'rescheduled'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {apt.customer && (
                        <button
                          type="button"
                          onClick={() => onViewCustomer && onViewCustomer(apt.customer_id)}
                          className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {apt.customer.name}
                        </button>
                      )}
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimeOnly(apt.start_time)} – {formatTimeOnly(apt.end_time)} ({apt.duration_minutes} min)
                      </span>
                      {apt.location && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {apt.location}
                        </span>
                      )}
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded p-2 mt-1">
                        {apt.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isScheduled && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(apt.id, 'completed')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="Mark event completed"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Complete
                      </button>
                    )}
                    {isScheduled && (
                      <button
                        type="button"
                        onClick={() => onStatusChange(apt.id, 'cancelled')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancel booking"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(apt)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Edit booking"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(apt)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
