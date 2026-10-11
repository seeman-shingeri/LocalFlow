import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { analyticsService, DashboardMetrics } from '@/services/analyticsService';
import { followUpService } from '@/services/followUpService';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { FollowUpsDueWidget } from '@/components/dashboard/FollowUpsDueWidget';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Inbox,
  Clock,
  AlertTriangle,
  Calendar,
  Receipt,
  DollarSign,
  TrendingUp,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { CustomerDetailDrawer } from '@/components/customer/CustomerDetailDrawer';
import { AIDraftModal } from '@/components/ai/AIDraftModal';
import { CustomerWithRelations, customerService } from '@/services/customerService';
import { CustomerFormModal } from '@/components/customer/CustomerFormModal';
import { EnquiryFormModal } from '@/components/enquiry/EnquiryFormModal';
import { AppointmentFormModal } from '@/components/appointment/AppointmentFormModal';
import { InvoiceFormModal } from '@/components/invoice/InvoiceFormModal';

export const DashboardPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [categorizedFollowUps, setCategorizedFollowUps] = useState<{ overdue: any[]; today: any[] }>({
    overdue: [],
    today: [],
  });
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(true);

  // Customer Drawer & AI modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [aiDraftCustomer, setAiDraftCustomer] = useState<any | null>(null);

  // Quick Action modals
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const loadDashboardData = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [met, followUps] = await Promise.all([
        analyticsService.getDashboardMetrics(currentWorkspace.id, periodDays),
        followUpService.getCategorized(currentWorkspace.id),
      ]);
      setMetrics(met);
      setCategorizedFollowUps({ overdue: followUps.overdue, today: followUps.today });
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentWorkspace, periodDays]);

  const handleCompleteFollowUp = async (item: any) => {
    try {
      await followUpService.markComplete(item.id);
      loadDashboardData();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time operations, customer follow-ups, and cash flow for {currentWorkspace?.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="text-xs rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>

          <Button variant="outline" size="sm" onClick={() => setCustomerModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Customer
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEnquiryModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Enquiry
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInvoiceModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Invoice
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/ai-assistant')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Ask AI
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={metrics?.totalCustomers ?? 0}
          subtitle="Active client accounts"
          icon={Users}
          variant="default"
          onClick={() => navigate('/customers')}
        />

        <StatCard
          title="Active Enquiries"
          value={formatCurrency(metrics?.activeEnquiriesValue ?? 0, currentWorkspace?.currency)}
          subtitle={`${metrics?.newEnquiriesCount ?? 0} new leads this period`}
          icon={Inbox}
          variant="default"
          onClick={() => navigate('/enquiries')}
        />

        <StatCard
          title="Follow-ups Due Today"
          value={metrics?.followUpsDueToday ?? 0}
          subtitle={
            (metrics?.overdueFollowUps ?? 0) > 0
              ? `⚠️ ${metrics?.overdueFollowUps} overdue tasks`
              : 'Zero overdue follow-ups'
          }
          icon={metrics?.overdueFollowUps ? AlertTriangle : Clock}
          variant={metrics?.overdueFollowUps ? 'danger' : 'warning'}
          onClick={() => navigate('/follow-ups')}
        />

        <StatCard
          title="Upcoming Bookings"
          value={metrics?.upcomingAppointmentsCount ?? 0}
          subtitle="Scheduled service appointments"
          icon={Calendar}
          variant="default"
          onClick={() => navigate('/appointments')}
        />

        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(metrics?.totalOutstandingInvoices ?? 0, currentWorkspace?.currency)}
          subtitle="Unpaid invoice balances"
          icon={Receipt}
          variant={(metrics?.totalOutstandingInvoices ?? 0) > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/invoices')}
        />

        <StatCard
          title="Collections (Period)"
          value={formatCurrency(metrics?.collectedRevenuePeriod ?? 0, currentWorkspace?.currency)}
          subtitle={`Total all time: ${formatCurrency(metrics?.totalRevenueAllTime ?? 0, currentWorkspace?.currency)}`}
          icon={DollarSign}
          variant="success"
          onClick={() => navigate('/invoices')}
        />

        <StatCard
          title="Enquiry Win Rate"
          value={`${metrics?.conversionRate ?? 0}%`}
          subtitle="Lead-to-converted ratio"
          icon={TrendingUp}
          variant="default"
          onClick={() => navigate('/enquiries')}
        />

        <StatCard
          title="Overdue Tasks"
          value={metrics?.overdueFollowUps ?? 0}
          subtitle="Requires immediate callback"
          icon={AlertTriangle}
          variant={metrics?.overdueFollowUps ? 'danger' : 'default'}
          onClick={() => navigate('/follow-ups')}
        />
      </div>

      {/* Main Charts & Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart (2 columns) */}
        <div className="lg:col-span-2">
          <RevenueChart data={metrics?.revenueChartData || []} />
        </div>

        {/* Follow-ups Due Widget (1 column) */}
        <div className="lg:col-span-1">
          <FollowUpsDueWidget
            overdue={categorizedFollowUps.overdue}
            today={categorizedFollowUps.today}
            onComplete={handleCompleteFollowUp}
            onViewCustomer={(cid) => setSelectedCustomerId(cid)}
          />
        </div>
      </div>

      {/* Secondary Row: Pipeline Stage Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Stage Breakdown */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Enquiry Pipeline Breakdown</CardTitle>
              <CardDescription>Active opportunities distributed by stage</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-3 pt-2">
            {metrics?.enquiryFunnelData && metrics.enquiryFunnelData.length > 0 ? (
              metrics.enquiryFunnelData.map((stage) => (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{stage.stage}</span>
                    <span>{stage.count} deals</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (stage.count / Math.max(1, metrics.newEnquiriesCount + 3)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No pipeline data recorded.</p>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Recent Business Activity</CardTitle>
              <CardDescription>Live feed of transactions, enquiries, and customers</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-3 pt-2">
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{act.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{act.subtitle}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent activity logs.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Customer 360 Detail Drawer */}
      <CustomerDetailDrawer
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onCustomerUpdated={() => loadDashboardData()}
      />

      {/* AI Draft Modal */}
      <AIDraftModal
        isOpen={Boolean(aiDraftCustomer)}
        onClose={() => setAiDraftCustomer(null)}
        customer={aiDraftCustomer}
      />

      {/* Quick Action Modals */}
      <CustomerFormModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
      <EnquiryFormModal
        isOpen={enquiryModalOpen}
        onClose={() => setEnquiryModalOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
      <AppointmentFormModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
      <InvoiceFormModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
    </div>
  );
};
