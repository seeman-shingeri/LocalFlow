import { customerService } from './customerService';
import { enquiryService } from './enquiryService';
import { followUpService } from './followUpService';
import { appointmentService } from './appointmentService';
import { invoiceService } from './invoiceService';
import { paymentService } from './paymentService';
import { isDateOverdue, isDateToday } from '@/lib/utils';
import { parseISO, subDays, isAfter, startOfDay, format } from 'date-fns';

export interface DashboardMetrics {
  totalCustomers: number;
  newEnquiriesCount: number;
  activeEnquiriesValue: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
  upcomingAppointmentsCount: number;
  totalOutstandingInvoices: number;
  collectedRevenuePeriod: number;
  totalRevenueAllTime: number;
  conversionRate: number;
  recentActivity: Array<{
    id: string;
    type: 'customer' | 'enquiry' | 'payment' | 'appointment' | 'follow_up';
    title: string;
    subtitle: string;
    timestamp: string;
  }>;
  revenueChartData: Array<{
    date: string;
    amount: number;
  }>;
  enquiryFunnelData: Array<{
    stage: string;
    count: number;
  }>;
}

export const analyticsService = {
  async getDashboardMetrics(workspaceId: string, daysPeriod: number = 30): Promise<DashboardMetrics> {
    const [
      customers,
      enquiries,
      followUps,
      appointments,
      invoices,
      payments,
    ] = await Promise.all([
      customerService.getAll(workspaceId),
      enquiryService.getAll(workspaceId),
      followUpService.getAll(workspaceId),
      appointmentService.getAll(workspaceId),
      invoiceService.getAll(workspaceId),
      paymentService.getAll(workspaceId),
    ]);

    const periodCutoff = subDays(new Date(), daysPeriod);

    // 1. Total Customers
    const totalCustomers = customers.filter((c) => c.status !== 'archived').length;

    // 2. Enquiries
    const newEnquiries = enquiries.filter(
      (e) => e.status === 'new' && isAfter(parseISO(e.created_at), periodCutoff)
    );
    const newEnquiriesCount = newEnquiries.length;
    const activeEnquiriesValue = enquiries
      .filter((e) => e.status !== 'converted' && e.status !== 'not_converted')
      .reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);

    const convertedEnquiries = enquiries.filter((e) => e.status === 'converted').length;
    const conversionRate = enquiries.length > 0
      ? Math.round((convertedEnquiries / enquiries.length) * 100 * 10) / 10
      : 0;

    // 3. Follow-ups
    const pendingFollowUps = followUps.filter((f) => f.status === 'pending');
    const followUpsDueToday = pendingFollowUps.filter((f) => isDateToday(f.due_date)).length;
    const overdueFollowUps = pendingFollowUps.filter((f) => isDateOverdue(f.due_date)).length;

    // 4. Appointments
    const now = new Date();
    const upcomingAppointmentsCount = appointments.filter(
      (a) => a.status === 'scheduled' && isAfter(parseISO(a.start_time), now)
    ).length;

    // 5. Invoices & Outstanding Receivables (exclude paid, cancelled, and unissued drafts)
    const totalOutstandingInvoices = invoices
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft')
      .reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0);

    // 6. Payments collected
    const collectedRevenuePeriod = payments
      .filter((p) => isAfter(parseISO(p.payment_date), periodCutoff))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalRevenueAllTime = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 7. Revenue Chart Data (Last 7 days or points)
    const chartMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(now, i), 'MMM d');
      chartMap.set(d, 0);
    }

    payments.forEach((p) => {
      try {
        const dStr = format(parseISO(p.payment_date), 'MMM d');
        if (chartMap.has(dStr)) {
          chartMap.set(dStr, (chartMap.get(dStr) || 0) + Number(p.amount));
        }
      } catch {
        // ignore format error
      }
    });

    const revenueChartData = Array.from(chartMap.entries()).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    // 8. Pipeline Funnel
    const stageCounts: Record<string, number> = {
      New: 0,
      Contacted: 0,
      Interested: 0,
      Converted: 0,
    };
    enquiries.forEach((e) => {
      if (e.status === 'new') stageCounts.New++;
      if (e.status === 'contacted') stageCounts.Contacted++;
      if (e.status === 'interested') stageCounts.Interested++;
      if (e.status === 'converted') stageCounts.Converted++;
    });

    const enquiryFunnelData = Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      count,
    }));

    // 9. Recent Activity feed
    const recentActivity: DashboardMetrics['recentActivity'] = [];

    payments.slice(0, 3).forEach((p) => {
      recentActivity.push({
        id: p.id,
        type: 'payment',
        title: `Payment received: $${Number(p.amount).toFixed(2)}`,
        subtitle: `Method: ${p.payment_method}`,
        timestamp: p.payment_date,
      });
    });

    enquiries.slice(0, 3).forEach((e) => {
      recentActivity.push({
        id: e.id,
        type: 'enquiry',
        title: `Enquiry: ${e.title}`,
        subtitle: `Stage: ${e.status.toUpperCase()} | $${Number(e.estimated_value).toFixed(2)}`,
        timestamp: e.created_at,
      });
    });

    customers.slice(0, 2).forEach((c) => {
      recentActivity.push({
        id: c.id,
        type: 'customer',
        title: `Customer created: ${c.name}`,
        subtitle: `Source: ${c.source}`,
        timestamp: c.created_at,
      });
    });

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalCustomers,
      newEnquiriesCount,
      activeEnquiriesValue: Math.round(activeEnquiriesValue * 100) / 100,
      followUpsDueToday,
      overdueFollowUps,
      upcomingAppointmentsCount,
      totalOutstandingInvoices: Math.round(totalOutstandingInvoices * 100) / 100,
      collectedRevenuePeriod: Math.round(collectedRevenuePeriod * 100) / 100,
      totalRevenueAllTime: Math.round(totalRevenueAllTime * 100) / 100,
      conversionRate,
      recentActivity: recentActivity.slice(0, 6),
      revenueChartData,
      enquiryFunnelData,
    };
  },
};
