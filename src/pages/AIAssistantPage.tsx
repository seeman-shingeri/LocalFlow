import React from 'react';
import { AIAssistantPanel } from '@/components/ai/AIAssistantPanel';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Sparkles, ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Business Assistant</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ask questions against your authorized workspace data, review follow-up obligations, and draft messages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Assistant (3 columns) */}
        <div className="lg:col-span-3">
          <AIAssistantPanel />
        </div>

        {/* AI Capabilities & Safety Guidelines (1 column) */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Workspace-Scoped AI</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              LocalFlow AI strictly queries your active business records. No private customer information is shared across workspaces or used for external model training.
            </p>
          </Card>

          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recommended Inquiries
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="font-semibold text-slate-800">"Which customers need follow-up today?"</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Lists overdue and scheduled client check-ins.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="font-semibold text-slate-800">"Summarize my outstanding invoices"</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Calculates unpaid balances and overdue dates.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="font-semibold text-slate-800">"Show enquiries that have not been contacted"</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Surfaces uncontacted pipeline opportunities.</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-2 text-xs text-slate-500">
            <p className="font-bold text-slate-700">Deterministic Protection</p>
            <p>
              All totals, monetary balances, and counts are calculated deterministically in code. AI assists with language drafting and conversational synthesis.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
