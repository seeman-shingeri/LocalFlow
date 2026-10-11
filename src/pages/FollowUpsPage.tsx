import React, { useState, useEffect } from 'react';
import { FollowUp } from '@/types/database';
import { followUpService, CategorizedFollowUps } from '@/services/followUpService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { FollowUpList } from '@/components/followUp/FollowUpList';
import { FollowUpFormModal } from '@/components/followUp/FollowUpFormModal';
import { RescheduleModal } from '@/components/followUp/RescheduleModal';
import { AIDraftModal } from '@/components/ai/AIDraftModal';
import { CustomerDetailDrawer } from '@/components/customer/CustomerDetailDrawer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button } from '@/components/ui/Button';
import { Clock, Plus, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

export const FollowUpsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<CategorizedFollowUps>({
    overdue: [],
    today: [],
    upcoming: [],
    completed: [],
  });
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<FollowUp | null>(null);
  const [aiDraftFollowUp, setAiDraftFollowUp] = useState<FollowUp | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Customer drawer
  const [drawerCustomerId, setDrawerCustomerId] = useState<string | null>(null);

  const loadFollowUps = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const cat = await followUpService.getCategorized(currentWorkspace.id);
      setData(cat);
      // Auto switch to overdue if today is empty but overdue has items
      if (cat.today.length === 0 && cat.overdue.length > 0 && activeTab === 'today') {
        setActiveTab('overdue');
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, [currentWorkspace]);

  const handleComplete = async (item: FollowUp) => {
    try {
      await followUpService.markComplete(item.id);
      loadFollowUps();
    } catch {
      // ignore
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !currentWorkspace) return;
    setDeleting(true);
    try {
      await followUpService.delete(deleteTarget.id, currentWorkspace.id);
      setDeleteTarget(null);
      loadFollowUps();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const getListForTab = () => {
    switch (activeTab) {
      case 'overdue':
        return data.overdue;
      case 'today':
        return data.today;
      case 'upcoming':
        return data.upcoming;
      case 'completed':
        return data.completed;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Follow-ups Today</h1>
            {data.overdue.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                {data.overdue.length} Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Never lose a lead. Track call backs, estimate reviews, and scheduled customer check-ins.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setFormModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Schedule Follow-up
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        {[
          {
            id: 'today',
            label: 'Due Today',
            count: data.today.length,
            badgeClass: 'bg-amber-100 text-amber-800',
          },
          {
            id: 'overdue',
            label: 'Overdue',
            count: data.overdue.length,
            badgeClass: 'bg-rose-100 text-rose-800 font-bold',
          },
          {
            id: 'upcoming',
            label: 'Upcoming',
            count: data.upcoming.length,
            badgeClass: 'bg-slate-100 text-slate-700',
          },
          {
            id: 'completed',
            label: 'Completed',
            count: data.completed.length,
            badgeClass: 'bg-emerald-100 text-emerald-800',
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`rounded-full px-2 py-0.2 text-[10px] ${tab.badgeClass}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Follow-up List */}
      <FollowUpList
        followUps={getListForTab()}
        onComplete={handleComplete}
        onReschedule={(f) => setRescheduleTarget(f)}
        onDraftAI={(f) => setAiDraftFollowUp(f)}
        onDelete={(f) => setDeleteTarget(f)}
        onViewCustomer={(cid) => setDrawerCustomerId(cid)}
      />

      {/* Modals */}
      <FollowUpFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSuccess={() => loadFollowUps()}
      />

      <RescheduleModal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        followUp={rescheduleTarget}
        onSuccess={() => loadFollowUps()}
      />

      <AIDraftModal
        isOpen={Boolean(aiDraftFollowUp)}
        onClose={() => setAiDraftFollowUp(null)}
        customer={aiDraftFollowUp?.customer || null}
        followUp={aiDraftFollowUp || undefined}
      />

      <CustomerDetailDrawer
        customerId={drawerCustomerId}
        onClose={() => setDrawerCustomerId(null)}
        onCustomerUpdated={() => loadFollowUps()}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Follow-up Task"
        message={`Are you sure you want to delete this follow-up?`}
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  );
};
