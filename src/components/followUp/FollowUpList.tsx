import React from 'react';
import { FollowUp } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime, isDateOverdue, isDateToday } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  Phone,
  Sparkles,
  RefreshCw,
  Trash2,
  User,
  Edit,
} from 'lucide-react';

interface FollowUpListProps {
  followUps: FollowUp[];
  onComplete: (followUp: FollowUp) => void;
  onReschedule: (followUp: FollowUp) => void;
  onEdit?: (followUp: FollowUp) => void;
  onDraftAI: (followUp: FollowUp) => void;
  onDelete: (followUp: FollowUp) => void;
  onViewCustomer?: (customerId: string) => void;
}

export const FollowUpList: React.FC<FollowUpListProps> = ({
  followUps,
  onComplete,
  onReschedule,
  onEdit,
  onDraftAI,
  onDelete,
  onViewCustomer,
}) => {
  if (followUps.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <p className="text-xs text-slate-500">No follow-ups in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {followUps.map((item) => {
        const overdue = isDateOverdue(item.due_date);
        const today = isDateToday(item.due_date);
        const isCompleted = item.status === 'completed';

        return (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 bg-white transition-all shadow-2xs hover:shadow-xs ${
              overdue && !isCompleted
                ? 'border-rose-300 bg-rose-50/20'
                : today && !isCompleted
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Complete button */}
              <button
                type="button"
                onClick={() => onComplete(item)}
                disabled={isCompleted}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600'
                }`}
                title={isCompleted ? 'Completed' : 'Mark as completed'}
              >
                <CheckCircle className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`text-sm font-bold text-slate-900 leading-snug ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {item.title}
                  </h4>
                  <Badge
                    variant={
                      item.priority === 'high'
                        ? 'danger'
                        : item.priority === 'medium'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {item.priority}
                  </Badge>
                  {overdue && !isCompleted && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> Overdue
                    </span>
                  )}
                  {today && !isCompleted && (
                    <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Due Today
                    </span>
                  )}
                </div>

                {/* Customer and Contact Link */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
                  {item.customer?.phone && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {item.customer.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDateTime(item.due_date)}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-md p-2 mt-1">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {!isCompleted && (
              <div className="flex items-center gap-2 pt-2 sm:pt-0 self-end sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDraftAI(item)}
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50/50"
                  title="Draft context-aware follow-up"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">AI Draft</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReschedule(item)}
                  title="Reschedule follow-up"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Reschedule</span>
                </Button>

                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Edit follow-up details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Delete follow-up"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
