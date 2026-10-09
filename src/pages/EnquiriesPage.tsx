import React, { useState, useEffect } from 'react';
import { Enquiry, EnquiryStatus } from '@/types/database';
import { enquiryService } from '@/services/enquiryService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { EnquiryPipeline } from '@/components/enquiry/EnquiryPipeline';
import { EnquiryFormModal } from '@/components/enquiry/EnquiryFormModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomerDetailDrawer } from '@/components/customer/CustomerDetailDrawer';
import { AIDraftModal } from '@/components/ai/AIDraftModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Inbox, Plus, LayoutGrid, List, User, Edit, Trash2 } from 'lucide-react';

export const EnquiriesPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Drawer & AI
  const [drawerCustomerId, setDrawerCustomerId] = useState<string | null>(null);
  const [aiCustomer, setAiCustomer] = useState<any | null>(null);

  const loadEnquiries = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const data = await enquiryService.getAll(currentWorkspace.id);
      setEnquiries(data);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [currentWorkspace]);

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    try {
      await enquiryService.updateStatus(id, newStatus);
      loadEnquiries();
    } catch {
      // error handled
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentWorkspace) return;
    setDeleting(true);
    try {
      await enquiryService.delete(deleteTarget.id, currentWorkspace.id);
      setDeleteTarget(null);
      loadEnquiries();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const totalPipelineValue = enquiries
    .filter((e) => e.status !== 'converted' && e.status !== 'not_converted')
    .reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);

  const wonDealsValue = enquiries
    .filter((e) => e.status === 'converted')
    .reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enquiry Pipeline</h1>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {enquiries.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track leads, quotes, and deal velocity from first contact to won business.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingEnquiry(null);
              setFormModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Enquiry
          </Button>
        </div>
      </div>

      {/* Pipeline Financial Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Active Pipeline Value
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalPipelineValue, currentWorkspace?.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Under evaluation & quote stage</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Converted Deals (Won)
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(wonDealsValue, currentWorkspace?.currency)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {enquiries.filter((e) => e.status === 'converted').length} successfully won jobs
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Pipeline Deals
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">{enquiries.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Across all pipeline stages
          </p>
        </div>
      </div>

      {/* Main Content: Kanban or Table */}
      {viewMode === 'kanban' ? (
        <EnquiryPipeline
          enquiries={enquiries}
          onStatusChange={handleStatusChange}
          onEdit={(enq) => {
            setEditingEnquiry(enq);
            setFormModalOpen(true);
          }}
          onDelete={(enq) => setDeleteTarget(enq)}
          onViewCustomer={(cid) => setDrawerCustomerId(cid)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4 text-right">Estimated Value</th>
                <th className="py-3 px-4 text-center">Stage</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{e.title}</td>

                    <td className="py-3.5 px-4">
                      {e.customer ? (
                        <button
                          type="button"
                          onClick={() => setDrawerCustomerId(e.customer_id)}
                          className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          {e.customer.name}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{e.service_type || 'General'}</td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(e.estimated_value, currentWorkspace?.currency)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={e.status}
                        onChange={(ev) => handleStatusChange(e.id, ev.target.value as EnquiryStatus)}
                        className="text-xs font-semibold rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="converted">Converted</option>
                        <option value="not_converted">Not Converted</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          e.priority === 'high' ? 'danger' : e.priority === 'medium' ? 'warning' : 'neutral'
                        }
                      >
                        {e.priority}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingEnquiry(e);
                            setFormModalOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(e)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <EnquiryFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingEnquiry(null);
        }}
        onSuccess={() => loadEnquiries()}
        initialEnquiry={editingEnquiry}
      />

      <CustomerDetailDrawer
        customerId={drawerCustomerId}
        onClose={() => setDrawerCustomerId(null)}
        onEdit={() => {}}
        onDraftAI={(c) => setAiCustomer(c)}
      />

      <AIDraftModal
        isOpen={Boolean(aiCustomer)}
        onClose={() => setAiCustomer(null)}
        customer={aiCustomer}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Enquiry"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete Enquiry"
        isLoading={deleting}
      />
    </div>
  );
};
