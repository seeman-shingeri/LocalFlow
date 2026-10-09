import { followUpService } from './followUpService';
import { enquiryService } from './enquiryService';
import { invoiceService } from './invoiceService';
import { customerService } from './customerService';
import { Customer, FollowUp, Invoice, Enquiry } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface AIResponse {
  answer: string;
  source: 'gemini' | 'deterministic-fallback';
  verifiedFacts: string[];
  suggestedAction?: {
    type: 'draft_message' | 'view_followups' | 'view_invoices';
    label: string;
    payload?: any;
  };
}

export interface DraftMessageInput {
  customer: Customer;
  contextType: 'follow_up' | 'quote_reminder' | 'invoice_overdue' | 'appointment_confirmation';
  channel: 'sms' | 'whatsapp' | 'email';
  businessName: string;
  extraNotes?: string;
  invoice?: Invoice;
  enquiry?: Enquiry;
  followUp?: FollowUp;
}

export const aiService = {
  getApiKey(): string | null {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key || key.includes('your-gemini-api-key')) {
      return null;
    }
    return key;
  },

  isAIConfigured(): boolean {
    return Boolean(this.getApiKey());
  },

  /**
   * Deterministic Business Assistant queries
   * Gathers facts from the user's authorized workspace first.
   */
  async processAssistantQuery(workspaceId: string, businessName: string, query: string): Promise<AIResponse> {
    const q = query.toLowerCase();

    // 1. Follow-ups query
    if (q.includes('follow') || q.includes('who') || q.includes('need') || q.includes('call')) {
      const categorized = await followUpService.getCategorized(workspaceId);
      const overdueCount = categorized.overdue.length;
      const todayCount = categorized.today.length;

      const facts: string[] = [
        `Overdue follow-ups: ${overdueCount}`,
        `Follow-ups due today: ${todayCount}`,
      ];

      let details = '';
      if (overdueCount > 0) {
        details += `\n⚠️ **Overdue (${overdueCount})**:\n` +
          categorized.overdue.map((f) => `• **${f.customer?.name || 'Customer'}**: ${f.title} (due ${formatDate(f.due_date)})`).join('\n');
      }

      if (todayCount > 0) {
        details += `\n\n📅 **Due Today (${todayCount})**:\n` +
          categorized.today.map((f) => `• **${f.customer?.name || 'Customer'}**: ${f.title}`).join('\n');
      }

      if (overdueCount === 0 && todayCount === 0) {
        details = '\nGreat job! You have no overdue follow-ups or pending tasks due today.';
      }

      return {
        answer: `Here is your verified follow-up status for **${businessName}**:${details}`,
        source: 'deterministic-fallback',
        verifiedFacts: facts,
        suggestedAction: {
          type: 'view_followups',
          label: 'Open Follow-ups Manager',
        },
      };
    }

    // 2. Outstanding Invoices query
    if (q.includes('invoice') || q.includes('outstanding') || q.includes('unpaid') || q.includes('owe') || q.includes('money')) {
      const invoices = await invoiceService.getAll(workspaceId);
      const unpaid = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
      const totalBalance = unpaid.reduce((sum, i) => sum + i.balance_due, 0);
      const overdueList = unpaid.filter((i) => i.status === 'overdue');

      const facts: string[] = [
        `Total unpaid invoices: ${unpaid.length}`,
        `Total outstanding receivables: ${formatCurrency(totalBalance)}`,
        `Overdue invoices count: ${overdueList.length}`,
      ];

      let details = `You have **${unpaid.length}** open invoices with a total outstanding balance of **${formatCurrency(totalBalance)}**.\n`;
      if (overdueList.length > 0) {
        details += `\n⚠️ **Overdue Invoices (${overdueList.length})**:\n` +
          overdueList.map((inv) => `• **${inv.invoice_number}** (${inv.customer?.name}): ${formatCurrency(inv.balance_due)} (Due: ${formatDate(inv.due_date)})`).join('\n');
      }

      return {
        answer: details,
        source: 'deterministic-fallback',
        verifiedFacts: facts,
        suggestedAction: {
          type: 'view_invoices',
          label: 'View Unpaid Invoices',
        },
      };
    }

    // 3. Uncontacted enquiries query
    if (q.includes('enquir') || q.includes('lead') || q.includes('contacted') || q.includes('pipeline')) {
      const enquiries = await enquiryService.getAll(workspaceId);
      const newLeads = enquiries.filter((e) => e.status === 'new');
      const contactedLeads = enquiries.filter((e) => e.status === 'contacted');

      const facts: string[] = [
        `New uncontacted leads: ${newLeads.length}`,
        `Contacted awaiting response: ${contactedLeads.length}`,
        `Total pipeline opportunities: ${enquiries.length}`,
      ];

      let details = `You currently have **${newLeads.length}** new uncontacted enquiries.\n`;
      if (newLeads.length > 0) {
        details += `\n🔥 **Awaiting First Contact**:\n` +
          newLeads.map((e) => `• **${e.customer?.name}**: ${e.title} (~${formatCurrency(e.estimated_value)})`).join('\n');
      }

      return {
        answer: details,
        source: 'deterministic-fallback',
        verifiedFacts: facts,
      };
    }

    // 4. General query: If Gemini API key is present, execute via Gemini; otherwise return deterministic summary
    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const prompt = `You are LocalFlow AI, a smart operations assistant for ${businessName}.
Answer this query concisely and professionally: "${query}".
Do not fabricate fake customer records or false guarantees. Keep responses brief, polite, and actionable.`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const generated = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generated) {
            return {
              answer: generated,
              source: 'gemini',
              verifiedFacts: ['Generated via Google Gemini 1.5 Flash'],
            };
          }
        }
      } catch (e) {
        console.warn('Gemini API fetch error, falling back to local assistant:', e);
      }
    }

    // Fallback response
    return {
      answer: `I can help you monitor follow-ups, draft customer communications, summarize outstanding receivables, and review new enquiries. Try asking:
• *"Which customers need follow-up today?"*
• *"Summarize my outstanding invoices"*
• *"Show enquiries that have not been contacted"*`,
      source: 'deterministic-fallback',
      verifiedFacts: ['Offline deterministic business assistant active'],
    };
  },

  /**
   * Drafts personalized, context-aware messages for customers
   * Works offline with professional templates and with Gemini API if key is provided.
   */
  async draftMessage(input: DraftMessageInput): Promise<{ subject: string; message: string; source: 'gemini' | 'template' }> {
    const { customer, contextType, channel, businessName, extraNotes, invoice, enquiry, followUp } = input;
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const systemPrompt = `You are a polite, concise business communications assistant for ${businessName}.
Draft a ${channel.toUpperCase()} message to ${customer.name}.
Context: ${contextType}
Customer phone: ${customer.phone || 'N/A'}
Additional business notes: ${extraNotes || 'None'}
${invoice ? `Invoice #${invoice.invoice_number}, Balance: $${invoice.balance_due}, Due: ${invoice.due_date}` : ''}
${enquiry ? `Enquiry: ${enquiry.title}` : ''}
${followUp ? `Follow-up goal: ${followUp.title}` : ''}

Output ONLY JSON in this exact structure:
{
  "subject": "Email subject line (or short title for SMS/WhatsApp)",
  "message": "Message text including courteous closing and business name"
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: 350,
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return {
              subject: parsed.subject || `${businessName} Follow-up`,
              message: parsed.message,
              source: 'gemini',
            };
          }
        }
      } catch (err) {
        console.warn('Gemini message drafting failed, using high-quality template:', err);
      }
    }

    // High quality deterministic templates
    let subject = `${businessName} Update`;
    let message = '';

    const firstName = customer.name.split(' ')[0] || customer.name;

    switch (contextType) {
      case 'follow_up':
        subject = `Following up regarding your inquiry with ${businessName}`;
        if (channel === 'sms' || channel === 'whatsapp') {
          message = `Hi ${firstName}, this is ${businessName}. Just checking in on your recent inquiry to see if you had any questions or if you'd like to schedule a time for us to take a look? Looking forward to assisting!`;
        } else {
          message = `Hi ${firstName},\n\nI hope you're having a productive week.\n\nI am following up regarding your recent service inquiry with ${businessName}. We want to ensure you have all the information needed and answer any questions regarding our availability and quote.\n\nPlease feel free to reply directly to this email or call us at your convenience.\n\nBest regards,\n${businessName}`;
        }
        break;

      case 'invoice_overdue':
        const invNum = invoice?.invoice_number || 'your invoice';
        const bal = invoice ? formatCurrency(invoice.balance_due) : 'the outstanding balance';
        subject = `Payment reminder: ${invNum} from ${businessName}`;
        if (channel === 'sms' || channel === 'whatsapp') {
          message = `Hi ${firstName}, friendly reminder that ${invNum} from ${businessName} has an outstanding balance of ${bal}. Please reach out or settle at your earliest convenience. Thank you!`;
        } else {
          message = `Hi ${firstName},\n\nWe hope everything is going well.\n\nThis is a friendly reminder that ${invNum} has an outstanding balance of ${bal}, which was due on ${formatDate(invoice?.due_date)}.\n\nIf you have already submitted payment, please disregard this note. Otherwise, please let us know if you need an updated copy of the invoice or payment link.\n\nThank you for your business,\n${businessName}`;
        }
        break;

      case 'appointment_confirmation':
        subject = `Appointment confirmation with ${businessName}`;
        if (channel === 'sms' || channel === 'whatsapp') {
          message = `Hi ${firstName}, confirming your upcoming appointment with ${businessName}. Please reply C to confirm or let us know if you need to reschedule.`;
        } else {
          message = `Hi ${firstName},\n\nThis is a confirmation of your upcoming service appointment with ${businessName}.\n\nOur technician will arrive promptly. If you need to make any changes or have specific instructions for arrival, please reply to this email.\n\nWarm regards,\n${businessName}`;
        }
        break;

      case 'quote_reminder':
      default:
        subject = `Quote update from ${businessName}`;
        if (channel === 'sms' || channel === 'whatsapp') {
          message = `Hi ${firstName}, this is ${businessName}. Checking in to see if you had a chance to review the estimate we prepared for you? Let us know if you'd like to proceed!`;
        } else {
          message = `Hi ${firstName},\n\nI wanted to follow up on the estimate we sent over. We are currently booking dates for the upcoming weeks and wanted to check if you would like to reserve a slot.\n\nLet us know if you have any questions!\n\nBest regards,\n${businessName}`;
        }
        break;
    }

    return {
      subject,
      message,
      source: 'template',
    };
  },
};
