import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { FollowUp } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, isDateOverdue } from '@/lib/utils';
import { CheckCircle, AlertTriangle, ArrowRight, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FollowUpsDueWidgetProps {
  overdue: FollowUp[];
  today: FollowUp[];
  onComplete: (item: FollowUp) => void;
  onViewCustomer?: (customerId: string) => void;
}

export const FollowUpsDueWidget: React.FC<FollowUpsDueWidgetProps> = ({
  overdue,
  today,
  onComplete,
  onViewCustomer,
}) => {
  const combined = [...overdue, ...today];

  return (
    <Card className="p-5">
      <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Follow-ups Requiring Action</CardTitle>
          <CardDescription>Overdue and scheduled customer calls for today</CardDescription>
        </div>
        <Link
          to="/follow-ups"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <div className="space-y-3 pt-2">
        {combined.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center p-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 mb-1" />
            <p className="text-xs font-bold text-slate-800">All caught up!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No overdue or pending follow-ups due today.
            </p>
          </div>
        ) : (
          combined.slice(0, 5).map((item) => {
            const isOverdueItem = isDateOverdue(item.due_date);

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isOverdueItem
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    {isOverdueItem ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded uppercase">
                        <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    {item.customer && (
                      <button
                        type="button"
                        onClick={() => onViewCustomer && onViewCustomer(item.customer_id)}
                        className="font-medium text-indigo-600 hover:underline flex items-center gap-1 truncate"
                      >
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.customer.name}</span>
                      </button>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(item.due_date)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onComplete(item)}
                  className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 shrink-0"
                >
                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                  Done
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
