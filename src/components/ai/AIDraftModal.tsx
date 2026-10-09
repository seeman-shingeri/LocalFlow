import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Customer, Invoice, Enquiry, FollowUp } from '@/types/database';
import { aiService, DraftMessageInput } from '@/services/aiService';
import { commsService } from '@/services/commsService';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Copy, Check, Sparkles, Send, Loader2 } from 'lucide-react';

interface AIDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  invoice?: Invoice;
  enquiry?: Enquiry;
  followUp?: FollowUp;
}

export const AIDraftModal: React.FC<AIDraftModalProps> = ({
  isOpen,
  onClose,
  customer,
  invoice,
  enquiry,
  followUp,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [contextType, setContextType] = useState<DraftMessageInput['contextType']>(
    invoice ? 'invoice_overdue' : followUp ? 'follow_up' : 'quote_reminder'
  );
  const [extraNotes, setExtraNotes] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState<'gemini' | 'template'>('template');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);

  const handleGenerate = async () => {
    if (!customer || !currentWorkspace) return;
    setGenerating(true);
    setCopied(false);
    setLogged(false);

    try {
      const res = await aiService.draftMessage({
        customer,
        contextType,
        channel,
        businessName: currentWorkspace.name,
        extraNotes: extraNotes.trim() || undefined,
        invoice,
        enquiry,
        followUp,
      });

      setSubject(res.subject);
      setMessage(res.message);
      setSource(res.source);
    } catch {
      // Non-fatal fallback
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      handleGenerate();
    }
  }, [isOpen, customer, channel, contextType]);

  if (!customer) return null;

  const handleCopy = () => {
    const textToCopy = channel === 'email' ? `Subject: ${subject}\n\n${message}` : message;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogToHistory = async () => {
    if (!currentWorkspace) return;
    try {
      await commsService.logMessage({
        workspace_id: currentWorkspace.id,
        customer_id: customer.id,
        channel: channel === 'whatsapp' ? 'whatsapp' : channel === 'sms' ? 'sms' : 'email',
        subject: channel === 'email' ? subject : undefined,
        content: message,
        status: 'logged',
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI-Assisted Customer Message Drafter"
      description={`Drafting personalized communication for ${customer.name}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <Select
            label="Delivery Channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
          >
            <option value="sms">SMS Text Message</option>
            <option value="whatsapp">WhatsApp Message</option>
            <option value="email">Email</option>
          </Select>

          <Select
            label="Communication Objective"
            value={contextType}
            onChange={(e) => setContextType(e.target.value as any)}
          >
            <option value="follow_up">General Service Follow-up</option>
            <option value="quote_reminder">Estimate / Quote Follow-up</option>
            <option value="invoice_overdue">Invoice Payment Reminder</option>
            <option value="appointment_confirmation">Appointment Confirmation</option>
          </Select>

          <div className="sm:col-span-2">
            <Input
              label="Additional Custom Instructions (Optional)"
              placeholder="e.g. Mention 10% seasonal discount if booked by Friday..."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              isLoading={generating}
              className="text-indigo-600 border-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Regenerate Draft
            </Button>
          </div>
        </div>

        {/* Draft Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Message Draft (Review & Edit)
              </label>
              <Badge variant={source === 'gemini' ? 'default' : 'neutral'}>
                {source === 'gemini' ? 'Gemini 1.5' : 'Smart Template'}
              </Badge>
            </div>
          </div>

          {channel === 'email' && (
            <Input
              label="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          )}

          <Textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Generated message will appear here..."
          />
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Note: Copy to clipboard to send via your mobile device, WhatsApp, or email client.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={copied ? 'border-emerald-500 text-emerald-600' : ''}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  Copy Draft
                </>
              )}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleLogToHistory}
              disabled={logged}
              className={logged ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
            >
              {logged ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Saved to History!
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Log to History
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
