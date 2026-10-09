export type WorkspacePlan = 'starter' | 'pro' | 'growth';
export type MemberRole = 'owner' | 'admin' | 'member';
export type CustomerStatus = 'lead' | 'active' | 'archived';
export type CustomerSource = 'Direct' | 'Website' | 'Referral' | 'Google' | 'Social Media' | 'Walk-in' | 'Other';
export type EnquiryStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'not_converted';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'other';
export type CommunicationChannel = 'email' | 'sms' | 'whatsapp' | 'call' | 'note';
export type CommunicationDirection = 'inbound' | 'outbound';
export type CommunicationStatus = 'draft' | 'sent' | 'logged';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  category: string;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  plan: WorkspacePlan;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  profile?: Profile;
}

export interface Customer {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  source: CustomerSource | string;
  status: CustomerStatus;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enquiry {
  id: string;
  workspace_id: string;
  customer_id: string;
  title: string;
  service_type: string | null;
  estimated_value: number;
  status: EnquiryStatus;
  priority: PriorityLevel;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface FollowUp {
  id: string;
  workspace_id: string;
  customer_id: string;
  enquiry_id: string | null;
  title: string;
  due_date: string;
  status: FollowUpStatus;
  priority: PriorityLevel;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  enquiry?: Enquiry;
}

export interface Appointment {
  id: string;
  workspace_id: string;
  customer_id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: AppointmentStatus;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  workspace_id: string;
  customer_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  workspace_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface CommunicationLog {
  id: string;
  workspace_id: string;
  customer_id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject: string | null;
  content: string;
  status: CommunicationStatus;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  workspace_id: string;
  user_id: string | null;
  action_type: string;
  prompt_summary: string | null;
  tokens_used: number;
  created_at: string;
}
