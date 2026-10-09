import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useWorkspace } from '@/context/WorkspaceContext';

interface RevenueChartProps {
  data: Array<{ date: string; amount: number }>;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { currentWorkspace } = useWorkspace();

  return (
    <Card className="p-5">
      <CardHeader className="px-0 pt-0">
        <div>
          <CardTitle>Collected Revenue (Recent Days)</CardTitle>
          <CardDescription>Verified incoming payments recorded in your ledger</CardDescription>
        </div>
      </CardHeader>

      <div className="h-64 w-full pt-4">
        {data.every((d) => d.amount === 0) ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No payments recorded in the selected period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val), currentWorkspace?.currency), 'Received']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
