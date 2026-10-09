import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { aiService, AIResponse } from '@/services/aiService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Bot, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  verifiedFacts?: string[];
  suggestedAction?: AIResponse['suggestedAction'];
  source?: 'gemini' | 'deterministic-fallback';
  timestamp: string;
}

export const AIAssistantPanel: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const isAIConfigured = aiService.isAIConfigured();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `Hello! I am your LocalFlow Business Operations Assistant. I monitor your follow-ups, invoices, and pipeline data. What would you like to check today?`,
      verifiedFacts: ['Live workspace data connected'],
      source: 'deterministic-fallback',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'Which customers need follow-up today?',
    'Summarize my outstanding invoices',
    'Show enquiries that have not been contacted',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || query;
    if (!text.trim() || !currentWorkspace) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const response = await aiService.processAssistantQuery(
        currentWorkspace.id,
        currentWorkspace.name,
        text.trim()
      );

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        verifiedFacts: response.verifiedFacts,
        suggestedAction: response.suggestedAction,
        source: response.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Error fallback
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: AIResponse['suggestedAction']) => {
    if (!action) return;
    if (action.type === 'view_followups') {
      navigate('/follow-ups');
    } else if (action.type === 'view_invoices') {
      navigate('/invoices');
    }
  };

  return (
    <Card className="flex flex-col h-[700px] p-0 overflow-hidden border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">LocalFlow AI Assistant</h3>
            <p className="text-xs text-slate-500">
              Authorized Business Intelligence & Message Drafting
            </p>
          </div>
        </div>

        <Badge variant={isAIConfigured ? 'default' : 'neutral'}>
          {isAIConfigured ? 'Gemini AI Active' : 'Deterministic Mode'}
        </Badge>
      </div>

      {/* Notice bar if Gemini key not set */}
      {!isAIConfigured && (
        <div className="bg-amber-50/80 px-6 py-2 border-b border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Operating in offline deterministic mode. Add <code className="font-mono font-semibold">VITE_GEMINI_API_KEY</code> in your environment to enable generative language features.
          </span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-2xl p-4 text-xs space-y-2.5 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

              {/* Verified Facts Tagging */}
              {msg.verifiedFacts && msg.verifiedFacts.length > 0 && (
                <div className="pt-2 border-t border-slate-200/70 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Verified Database Facts
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.verifiedFacts.map((fact, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {fact}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {msg.suggestedAction && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleActionClick(msg.suggestedAction)}
                    className="bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-7 text-xs"
                  >
                    <span>{msg.suggestedAction.label}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}

              <p
                className={`text-[10px] ${
                  msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </p>
            </div>

            {msg.sender === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400 italic py-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bot className="w-4 h-4" />
            </div>
            <span>Analyzing database records...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask a question about your follow-ups, invoices, or customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <Button type="submit" size="sm" isLoading={loading} disabled={!query.trim()}>
            <Send className="w-3.5 h-3.5 mr-1" />
            Ask
          </Button>
        </form>
      </div>
    </Card>
  );
};
