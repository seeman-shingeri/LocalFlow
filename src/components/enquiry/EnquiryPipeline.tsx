import React from 'react';
import { Enquiry, EnquiryStatus } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowRight, MoreHorizontal, Edit, Trash2, User } from 'lucide-react';

interface EnquiryPipelineProps {
  enquiries: Enquiry[];
  onStatusChange: (id: string, newStatus: EnquiryStatus) => void;
  onEdit: (enquiry: Enquiry) => void;
  onDelete: (enquiry: Enquiry) => void;
  onViewCustomer?: (customerId: string) => void;
}

const STAGES: Array<{ id: EnquiryStatus; label: string; color: string; badgeVariant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = [
  { id: 'new', label: 'New Lead', color: 'border-sky-300 bg-sky-50/40', badgeVariant: 'info' },
  { id: 'contacted', label: 'Contacted', color: 'border-indigo-300 bg-indigo-50/40', badgeVariant: 'default' },
  { id: 'interested', label: 'Interested / Quoted', color: 'border-amber-300 bg-amber-50/40', badgeVariant: 'warning' },
  { id: 'converted', label: 'Converted (Won)', color: 'border-emerald-300 bg-emerald-50/40', badgeVariant: 'success' },
  { id: 'not_converted', label: 'Not Converted', color: 'border-slate-300 bg-slate-50/40', badgeVariant: 'danger' },
];

export const EnquiryPipeline: React.FC<EnquiryPipelineProps> = ({
  enquiries,
  onStatusChange,
  onEdit,
  onDelete,
  onViewCustomer,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {STAGES.map((stage) => {
        const stageEnquiries = enquiries.filter((e) => e.status === stage.id);
        const stageTotalValue = stageEnquiries.reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);

        return (
          <div
            key={stage.id}
            className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 min-h-[420px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {stage.label}
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {formatCurrency(stageTotalValue)}
                </p>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-700 shadow-2xs border border-slate-200">
                {stageEnquiries.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {stageEnquiries.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400">No enquiries in this stage</p>
                </div>
              ) : (
                stageEnquiries.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                      <Badge
                        variant={
                          item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'neutral'
                        }
                      >
                        {item.priority}
                      </Badge>
                    </div>

                    {/* Customer Name */}
                    {item.customer && (
                      <button
                        onClick={() => onViewCustomer && onViewCustomer(item.customer_id)}
                        className="flex items-center gap-1.5 mt-2 text-xs font-medium text-indigo-600 hover:underline truncate text-left"
                      >
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.customer.name}</span>
                      </button>
                    )}

                    {/* Estimated Value */}
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="text-slate-400">Value:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.estimated_value)}
                      </span>
                    </div>

                    {/* Stage Transition Selector */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <select
                        value={item.status}
                        onChange={(e) => onStatusChange(item.id, e.target.value as EnquiryStatus)}
                        className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="new">Move: New</option>
                        <option value="contacted">Move: Contacted</option>
                        <option value="interested">Move: Interested</option>
                        <option value="converted">Move: Converted</option>
                        <option value="not_converted">Move: Not Converted</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Edit enquiry"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                          title="Delete enquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
