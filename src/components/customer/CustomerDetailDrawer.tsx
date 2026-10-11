import React, { useState, useEffect } from 'react';
import { CustomerWithRelations, customerService } from '@/services/customerService';
import { commsService } from '@/services/commsService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Receipt,
  Inbox,
  MessageSquare,
  Edit,
  Clock,
  Sparkles,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { CommunicationChannel } from '@/types/database';
import { CustomerFormModal } from './CustomerFormModal';
import { AIDraftModal } from '@/components/ai/AIDraftModal';

interface CustomerDetailDrawerProps {
  customerId: string | null;
  onClose: () => void;
  onEdit?: (customer: CustomerWithRelations) => void;
  onDraftAI?: (customer: CustomerWithRelations) => void;
  onCustomerUpdated?: () => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customerId,
  onClose,
  onEdit,
  onDraftAI,
  onCustomerUpdated,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<CustomerWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'appointments' | 'invoices' | 'comms'>('overview');

  // Self-contained Edit & AI Draft modals
  const [internalEditOpen, setInternalEditOpen] = useState(false);
  const [internalAiOpen, setInternalAiOpen] = useState(false);

  // Log message dialog
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [commChannel, setCommChannel] = useState<CommunicationChannel>('note');
  const [commContent, setCommContent] = useState('');
  const [submittingComm, setSubmittingComm] = useState(false);

  const loadCustomer = async () => {
    if (!customerId || !currentWorkspace) return;
    setLoading(true);
    try {
      const res = await customerService.getById(customerId, currentWorkspace.id);
      setData(res);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [customerId, currentWorkspace]);

  if (!customerId) return null;

  const handleToggleArchive = async () => {
    if (!data) return;
    const nextStatus = data.status === 'archived' ? 'active' : 'archived';
    try {
      await customerService.update(data.id, { status: nextStatus });
      await loadCustomer();
      onCustomerUpdated?.();
    } catch {
      // ignore
    }
  };

  const handleLogCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !data || !commContent.trim()) return;
    setSubmittingComm(true);
    try {
      await commsService.logMessage({
        workspace_id: currentWorkspace.id,
        customer_id: data.id,
        channel: commChannel,
        content: commContent.trim(),
        status: 'logged',
      });
      setCommContent('');
      setLogModalOpen(false);
      await loadCustomer();
      onCustomerUpdated?.();
    } catch {
      // ignore
    } finally {
      setSubmittingComm(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={onClose}
        />

        {/* Slide-out drawer */}
        <div className="relative z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                {data?.name ? data.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{data?.name || 'Customer Profile'}</h2>
                  {data?.status && (
                    <Badge variant={data.status === 'active' ? 'success' : data.status === 'lead' ? 'info' : 'neutral'}>
                      {data.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Source: <span className="font-medium text-slate-700">{data?.source || 'Direct'}</span> • Created {formatDate(data?.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleArchive}
                    title={data.status === 'archived' ? 'Restore customer' : 'Archive customer'}
                  >
                    {data.status === 'archived' ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5 mr-1" />
                        Archive
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onEdit) {
                        onEdit(data);
                      } else {
                        setInternalEditOpen(true);
                      }
                    }}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                </>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
                aria-label="Close customer drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Contact & Action Bar */}
          <div className="border-b border-slate-100 bg-white px-6 py-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3.5">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{data?.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{data?.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{data?.address || 'No address'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (!data) return;
                  if (onDraftAI) {
                    onDraftAI(data);
                  } else {
                    setInternalAiOpen(true);
                  }
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Draft AI Follow-up
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setLogModalOpen(true)}>
                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Log Communication
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Clock },
              { id: 'enquiries', label: `Enquiries (${data?.enquiries?.length || 0})`, icon: Inbox },
              { id: 'appointments', label: `Appointments (${data?.appointments?.length || 0})`, icon: Calendar },
              { id: 'invoices', label: `Invoices (${data?.invoices?.length || 0})`, icon: Receipt },
              { id: 'comms', label: `History (${data?.communications?.length || 0})`, icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Notes & Preferences</h4>
                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {data?.notes || 'No notes added for this customer yet.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-slate-400 text-[11px] font-medium uppercase">Last Contacted</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {formatDate(data?.last_contact_date)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-slate-400 text-[11px] font-medium uppercase">Next Scheduled Follow-up</p>
                    <p className="text-sm font-bold text-indigo-600 mt-1">
                      {formatDate(data?.next_follow_up_date)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'enquiries' && (
              <div className="space-y-3">
                {data?.enquiries && data.enquiries.length > 0 ? (
                  data.enquiries.map((enq) => (
                    <div key={enq.id} className="rounded-xl border border-slate-200 p-4 hover:border-slate-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{enq.title}</h4>
                        <Badge variant={enq.status === 'converted' ? 'success' : 'default'}>
                          {enq.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>Type: {enq.service_type || 'General'}</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(enq.estimated_value)}
                        </span>
                      </div>
                      {enq.notes && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{enq.notes}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8">No enquiries linked to this customer.</p>
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-3">
                {data?.appointments && data.appointments.length > 0 ? (
                  data.appointments.map((apt) => (
                    <div key={apt.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{apt.title}</h4>
                        <Badge variant={apt.status === 'completed' ? 'success' : 'default'}>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        📅 {formatDateTime(apt.start_time)} ({apt.duration_minutes} mins)
                      </p>
                      {apt.location && <p className="text-xs text-slate-500 mt-0.5">📍 {apt.location}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8">No appointments scheduled for this customer.</p>
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="space-y-3">
                {data?.invoices && data.invoices.length > 0 ? (
                  data.invoices.map((inv) => (
                    <div key={inv.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{inv.invoice_number}</h4>
                          <p className="text-xs text-slate-500">Due: {formatDate(inv.due_date)}</p>
                        </div>
                        <Badge
                          variant={
                            inv.status === 'paid'
                              ? 'success'
                              : inv.status === 'partial'
                              ? 'warning'
                              : inv.status === 'overdue'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs border-t border-slate-100 pt-2">
                        <span>Total: <strong>{formatCurrency(inv.total_amount)}</strong></span>
                        <span className={inv.balance_due > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                          Balance Due: {formatCurrency(inv.balance_due)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8">No invoices created for this customer.</p>
                )}
              </div>
            )}

            {activeTab === 'comms' && (
              <div className="space-y-3">
                {data?.communications && data.communications.length > 0 ? (
                  data.communications.map((comm) => (
                    <div key={comm.id} className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {comm.channel}
                        </span>
                        <span className="text-slate-400">{formatDateTime(comm.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap">{comm.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8">No communication logs recorded yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Communication Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={`Log Communication - ${data?.name}`}
        description="Record a note, call summary, or customer interaction."
        maxWidth="md"
      >
        <form onSubmit={handleLogCommunication} className="space-y-4">
          <Select
            label="Communication Channel"
            value={commChannel}
            onChange={(e) => setCommChannel(e.target.value as CommunicationChannel)}
          >
            <option value="note">Internal Note</option>
            <option value="call">Phone Call</option>
            <option value="sms">SMS Text</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </Select>

          <Textarea
            label="Details / Summary *"
            required
            rows={4}
            placeholder="Discussed spring service options, agreed on Monday callback..."
            value={commContent}
            onChange={(e) => setCommContent(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setLogModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={submittingComm}>
              Log Activity
            </Button>
          </div>
        </form>
      </Modal>

      <CustomerFormModal
        isOpen={internalEditOpen}
        onClose={() => setInternalEditOpen(false)}
        initialCustomer={data}
        onSuccess={() => {
          loadCustomer();
          onCustomerUpdated?.();
        }}
      />

      <AIDraftModal
        isOpen={internalAiOpen}
        onClose={() => {
          setInternalAiOpen(false);
          loadCustomer();
          onCustomerUpdated?.();
        }}
        customer={data}
      />
    </>
  );
};
