import {
  Customer,
  Enquiry,
  FollowUp,
  Appointment,
  Invoice,
  Payment,
  CommunicationLog,
  Workspace,
  Profile,
  InventoryItem,
} from '@/types/database';
import { addDays, subDays, format } from 'date-fns';

const STORAGE_KEY_PREFIX = 'localflow_';

export const INITIAL_WORKSPACE: Workspace = {
  id: 'ws-apex-001',
  name: 'Apex Home & HVAC Services',
  category: 'Heating & Cooling Services',
  currency: 'USD',
  phone: '+1 (555) 234-8901',
  email: 'service@apexhvac.example.com',
  address: '450 Industrial Parkway, Suite 100, Austin, TX 78701',
  timezone: 'America/Chicago',
  plan: 'pro',
  owner_id: 'user-apex-owner-001',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_PROFILE: Profile = {
  id: 'user-apex-owner-001',
  full_name: 'Marcus Vance',
  email: 'marcus@apexhvac.example.com',
  avatar_url: null,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

const today = new Date();
const todayIsoDate = format(today, 'yyyy-MM-dd');

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    workspace_id: 'ws-apex-001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@gmail.com',
    phone: '+1 (512) 555-0192',
    address: '1420 Oak Ridge Trail, Austin, TX',
    notes: 'Premium residential client. Heat pump installed in 2023. Needs spring maintenance check.',
    source: 'Google',
    status: 'active',
    last_contact_date: subDays(today, 2).toISOString(),
    next_follow_up_date: today.toISOString(),
    created_at: subDays(today, 25).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
  },
  {
    id: 'cust-002',
    workspace_id: 'ws-apex-001',
    name: 'David Miller',
    email: 'dmiller@millerbakery.com',
    phone: '+1 (512) 555-0144',
    address: '88 Barton Springs Rd, Austin, TX',
    notes: 'Commercial kitchen owner. Urgent rooftop AC inspection for refrigeration room.',
    source: 'Referral',
    status: 'lead',
    last_contact_date: subDays(today, 1).toISOString(),
    next_follow_up_date: addDays(today, 1).toISOString(),
    created_at: subDays(today, 3).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'cust-003',
    workspace_id: 'ws-apex-001',
    name: 'Elena Rostova',
    email: 'elena.rostova@techco.io',
    phone: '+1 (512) 555-0188',
    address: '304 Lavaca St, Apt 12B, Austin, TX',
    notes: 'Smart thermostat setup and duct cleaning inquiry.',
    source: 'Website',
    status: 'active',
    last_contact_date: subDays(today, 5).toISOString(),
    next_follow_up_date: subDays(today, 1).toISOString(), // Overdue follow-up!
    created_at: subDays(today, 14).toISOString(),
    updated_at: subDays(today, 5).toISOString(),
  },
  {
    id: 'cust-004',
    workspace_id: 'ws-apex-001',
    name: 'Robert Torres',
    email: 'rtorres@austinproperties.net',
    phone: '+1 (512) 555-0167',
    address: '710 W 6th St, Austin, TX',
    notes: 'Manages 4 multi-family duplexes. High-value repeat client looking for annual service plan.',
    source: 'Direct',
    status: 'active',
    last_contact_date: subDays(today, 7).toISOString(),
    next_follow_up_date: addDays(today, 3).toISOString(),
    created_at: subDays(today, 40).toISOString(),
    updated_at: subDays(today, 7).toISOString(),
  },
  {
    id: 'cust-005',
    workspace_id: 'ws-apex-001',
    name: 'Chloe Bennett',
    email: 'chloe.b@lifestylemedia.org',
    phone: '+1 (512) 555-0111',
    address: '2204 South Congress Ave, Austin, TX',
    notes: 'Inquired about ductless mini-split system for backyard studio office.',
    source: 'Social Media',
    status: 'lead',
    last_contact_date: null,
    next_follow_up_date: today.toISOString(),
    created_at: subDays(today, 1).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
];

export const INITIAL_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-001',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-002',
    title: 'Commercial Rooftop AC Emergency Repair',
    service_type: 'Commercial Repair',
    estimated_value: 1850.00,
    status: 'contacted',
    priority: 'high',
    notes: 'Compressor unit tripping circuit breaker during noon heat peak.',
    created_at: subDays(today, 3).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'enq-002',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-005',
    title: 'Ductless Mini-Split Installation',
    service_type: 'New Installation',
    estimated_value: 3600.00,
    status: 'new',
    priority: 'medium',
    notes: 'Single zone 18,000 BTU unit needed for detached office pod.',
    created_at: subDays(today, 1).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'enq-003',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-004',
    title: 'Bi-Annual Multi-Unit Preventative Maintenance',
    service_type: 'Maintenance Contract',
    estimated_value: 2400.00,
    status: 'interested',
    priority: 'high',
    notes: 'Quote sent for 8 units across two duplex properties.',
    created_at: subDays(today, 10).toISOString(),
    updated_at: subDays(today, 4).toISOString(),
  },
  {
    id: 'enq-004',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-001',
    title: 'Annual Heat Pump Servicing & Filter Replacement',
    service_type: 'Tune-up',
    estimated_value: 320.00,
    status: 'converted',
    priority: 'medium',
    notes: 'Customer accepted seasonal maintenance tune-up package.',
    created_at: subDays(today, 15).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
  },
];

export const INITIAL_FOLLOW_UPS: FollowUp[] = [
  {
    id: 'flw-001',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-001',
    enquiry_id: 'enq-004',
    title: 'Confirm appointment time for heat pump inspection',
    due_date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
    status: 'pending',
    priority: 'medium',
    notes: 'Send text or quick call to confirm she will be home at 3 PM tomorrow.',
    completed_at: null,
    created_at: subDays(today, 2).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
  },
  {
    id: 'flw-002',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-003',
    enquiry_id: null,
    title: 'Follow up on duct cleaning estimate proposal',
    due_date: subDays(today, 1).toISOString(), // OVERDUE
    status: 'pending',
    priority: 'high',
    notes: 'Customer opened quote email yesterday. Follow up via friendly message to answer any questions.',
    completed_at: null,
    created_at: subDays(today, 5).toISOString(),
    updated_at: subDays(today, 5).toISOString(),
  },
  {
    id: 'flw-003',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-005',
    enquiry_id: 'enq-002',
    title: 'Initial enquiry outreach for studio mini-split',
    due_date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30).toISOString(), // DUE TODAY
    status: 'pending',
    priority: 'medium',
    notes: 'Inquired via website form yesterday afternoon.',
    completed_at: null,
    created_at: subDays(today, 1).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'flw-004',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-004',
    enquiry_id: 'enq-003',
    title: 'Check in regarding commercial contract terms',
    due_date: addDays(today, 2).toISOString(),
    status: 'pending',
    priority: 'medium',
    notes: 'Client reviewed with his business partner, follow up on Friday.',
    completed_at: null,
    created_at: subDays(today, 4).toISOString(),
    updated_at: subDays(today, 4).toISOString(),
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-001',
    title: 'Seasonal Heat Pump Tune-up & Safety Check',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0).toISOString(),
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 30).toISOString(),
    duration_minutes: 90,
    status: 'scheduled',
    location: '1420 Oak Ridge Trail, Austin, TX',
    notes: 'Customer requested tech call 15 minutes before arrival.',
    created_at: subDays(today, 2).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
  },
  {
    id: 'apt-002',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-002',
    title: 'Rooftop Commercial Unit Diagnostic & Voltage Test',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString(), // TODAY
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30).toISOString(),
    duration_minutes: 90,
    status: 'scheduled',
    location: '88 Barton Springs Rd, Austin, TX',
    notes: 'Access roof via rear kitchen service stairs.',
    created_at: subDays(today, 1).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'apt-003',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-004',
    title: 'Duplex Property HVAC Pre-Season Inspection',
    start_time: addDays(today, 3).toISOString(),
    end_time: addDays(today, 3).toISOString(),
    duration_minutes: 120,
    status: 'scheduled',
    location: '710 W 6th St, Austin, TX',
    notes: 'Inspect units A and B.',
    created_at: subDays(today, 5).toISOString(),
    updated_at: subDays(today, 5).toISOString(),
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-001',
    invoice_number: 'INV-2025-001',
    issue_date: format(subDays(today, 10), 'yyyy-MM-dd'),
    due_date: format(addDays(today, 4), 'yyyy-MM-dd'),
    subtotal: 320.00,
    tax_rate: 8.25,
    tax_amount: 26.40,
    total_amount: 346.40,
    paid_amount: 346.40,
    balance_due: 0.00,
    status: 'paid',
    notes: 'Includes comprehensive electrical amp draw check and fresh HEPA filtration media.',
    terms: 'Payment due within 14 days of invoice date.',
    created_at: subDays(today, 10).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
    items: [
      { id: 'item-001', invoice_id: 'inv-001', description: 'Comprehensive Seasonal Heat Pump Tune-up', quantity: 1, unit_price: 240.00, line_total: 240.00, sort_order: 1 },
      { id: 'item-002', invoice_id: 'inv-001', description: 'Dual-stage HEPA Filtration Media Replacement', quantity: 2, unit_price: 40.00, line_total: 80.00, sort_order: 2 },
    ],
  },
  {
    id: 'inv-002',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-004',
    invoice_number: 'INV-2025-002',
    issue_date: format(subDays(today, 14), 'yyyy-MM-dd'),
    due_date: format(subDays(today, 2), 'yyyy-MM-dd'), // OVERDUE
    subtotal: 1200.00,
    tax_rate: 8.25,
    tax_amount: 99.00,
    total_amount: 1299.00,
    paid_amount: 500.00,
    balance_due: 799.00,
    status: 'partial',
    notes: 'Emergency condenser fan motor replacement on duplex unit A.',
    terms: 'Net 10 days. Late fee applies after due date.',
    created_at: subDays(today, 14).toISOString(),
    updated_at: subDays(today, 5).toISOString(),
    items: [
      { id: 'item-003', invoice_id: 'inv-002', description: 'OEM 1/3 HP Condenser Fan Motor Replacement', quantity: 1, unit_price: 650.00, line_total: 650.00, sort_order: 1 },
      { id: 'item-004', invoice_id: 'inv-002', description: 'Emergency Service Call & Diagnostic Labor', quantity: 1, unit_price: 550.00, line_total: 550.00, sort_order: 2 },
    ],
  },
  {
    id: 'inv-003',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-002',
    invoice_number: 'INV-2025-003',
    issue_date: todayIsoDate,
    due_date: format(addDays(today, 14), 'yyyy-MM-dd'),
    subtotal: 1850.00,
    tax_rate: 8.25,
    tax_amount: 152.63,
    total_amount: 2002.63,
    paid_amount: 0.00,
    balance_due: 2002.63,
    status: 'sent',
    notes: 'Commercial rooftop system diagnostic & compressor valve overhaul estimate.',
    terms: 'Payment due on receipt of services.',
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
    items: [
      { id: 'item-005', invoice_id: 'inv-003', description: 'Commercial Rooftop Diagnostic and Voltage Isolation', quantity: 1, unit_price: 450.00, line_total: 450.00, sort_order: 1 },
      { id: 'item-006', invoice_id: 'inv-003', description: 'Compressor Valve Rebuild Kit & Refrigerant Top-up', quantity: 1, unit_price: 1400.00, line_total: 1400.00, sort_order: 2 },
    ],
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    workspace_id: 'ws-apex-001',
    invoice_id: 'inv-001',
    customer_id: 'cust-001',
    amount: 346.40,
    payment_date: subDays(today, 2).toISOString(),
    payment_method: 'card',
    transaction_reference: 'STRIPE_CH_98234710',
    notes: 'Paid in full via online card processing.',
    created_at: subDays(today, 2).toISOString(),
  },
  {
    id: 'pay-002',
    workspace_id: 'ws-apex-001',
    invoice_id: 'inv-002',
    customer_id: 'cust-004',
    amount: 500.00,
    payment_date: subDays(today, 5).toISOString(),
    payment_method: 'bank_transfer',
    transaction_reference: 'ACH_DEP_440192',
    notes: 'Initial 50% deposit for emergency parts and service.',
    created_at: subDays(today, 5).toISOString(),
  },
];

export const INITIAL_COMMUNICATION_LOGS: CommunicationLog[] = [
  {
    id: 'comm-001',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-001',
    channel: 'sms',
    direction: 'outbound',
    subject: null,
    content: 'Hi Sarah, this is Apex HVAC confirming your seasonal tune-up for tomorrow at 10 AM. Reply C to confirm or let us know if you need to reschedule.',
    status: 'sent',
    created_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'comm-002',
    workspace_id: 'ws-apex-001',
    customer_id: 'cust-004',
    channel: 'email',
    direction: 'outbound',
    subject: 'Invoice INV-2025-002 Payment Reminder',
    content: 'Hi Robert, attached is the updated statement for the duplex condenser service showing remaining balance of $799.00. Please let us know if you have questions.',
    status: 'sent',
    created_at: subDays(today, 2).toISOString(),
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    workspace_id: 'ws-apex-001',
    name: 'Waterproof Shamiyana Marquee Tent (40x60 ft)',
    category: 'Shamiyana & Tents',
    sku: 'SHAM-TNT-4060',
    total_quantity: 10,
    available_quantity: 2,
    reserved_quantity: 8,
    min_stock_level: 4,
    rental_rate_per_day: 350.0,
    unit: 'units',
    location: 'Main Warehouse Bay A-1',
    notes: 'Heavy-duty fire-retardant fabric. High seasonal demand for outdoor weddings.',
    created_at: subDays(today, 60).toISOString(),
    updated_at: subDays(today, 2).toISOString(),
  },
  {
    id: 'inv-002',
    workspace_id: 'ws-apex-001',
    name: 'Heavy Duty Galvanized Steel Support Poles (20ft)',
    category: 'Rigging & Hardware',
    sku: 'SHAM-POLE-20',
    total_quantity: 60,
    available_quantity: 5,
    reserved_quantity: 55,
    min_stock_level: 15,
    rental_rate_per_day: 15.0,
    unit: 'units',
    location: 'Rigging Rack 3',
    notes: 'Structural tent uprights. 55 currently deployed across 3 event sites.',
    created_at: subDays(today, 60).toISOString(),
    updated_at: subDays(today, 1).toISOString(),
  },
  {
    id: 'inv-003',
    workspace_id: 'ws-apex-001',
    name: 'White Padded Banquet Chairs',
    category: 'Seating & Tables',
    sku: 'SEAT-CHR-WHT',
    total_quantity: 500,
    available_quantity: 40,
    reserved_quantity: 460,
    min_stock_level: 100,
    rental_rate_per_day: 3.5,
    unit: 'units',
    location: 'Stack Section B',
    notes: 'Deluxe banquet chairs. 460 booked for weekend corporate banquet.',
    created_at: subDays(today, 45).toISOString(),
    updated_at: subDays(today, 3).toISOString(),
  },
  {
    id: 'inv-004',
    workspace_id: 'ws-apex-001',
    name: 'Warm LED Fairy String Lights (100m Commercial Reel)',
    category: 'Lighting & Electrical',
    sku: 'LIGHT-STR-100',
    total_quantity: 40,
    available_quantity: 0,
    reserved_quantity: 40,
    min_stock_level: 8,
    rental_rate_per_day: 45.0,
    unit: 'sets',
    location: 'Electrical Cage 2',
    notes: 'All 40 reels booked for reception canopy lighting.',
    created_at: subDays(today, 30).toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'inv-005',
    workspace_id: 'ws-apex-001',
    name: 'Royal Red Carpet Runner (50x6 ft)',
    category: 'Flooring & Carpets',
    sku: 'FLR-CRP-RED50',
    total_quantity: 25,
    available_quantity: 18,
    reserved_quantity: 7,
    min_stock_level: 5,
    rental_rate_per_day: 80.0,
    unit: 'rolls',
    location: 'Carpet Loft 1',
    notes: 'Cleaned and vacuum-sealed after each rental.',
    created_at: subDays(today, 90).toISOString(),
    updated_at: subDays(today, 10).toISOString(),
  },
  {
    id: 'inv-006',
    workspace_id: 'ws-apex-001',
    name: 'Round Banquet Dining Tables (60-inch)',
    category: 'Seating & Tables',
    sku: 'SEAT-TBL-60',
    total_quantity: 40,
    available_quantity: 22,
    reserved_quantity: 18,
    min_stock_level: 10,
    rental_rate_per_day: 18.0,
    unit: 'units',
    location: 'Table Storage D',
    notes: 'Seats 8-10 people. Heavy duty folding wood core.',
    created_at: subDays(today, 45).toISOString(),
    updated_at: subDays(today, 5).toISOString(),
  },
  {
    id: 'inv-007',
    workspace_id: 'ws-apex-001',
    name: 'Portable PA Sound System & Dual Wireless Mics',
    category: 'Sound & Audio',
    sku: 'SND-PA-SYS01',
    total_quantity: 8,
    available_quantity: 1,
    reserved_quantity: 7,
    min_stock_level: 3,
    rental_rate_per_day: 150.0,
    unit: 'sets',
    location: 'AV Room Shelf 1',
    notes: 'Includes 2x JBL active speakers, mixer, and wireless Shure mics.',
    created_at: subDays(today, 30).toISOString(),
    updated_at: subDays(today, 4).toISOString(),
  },
];

/**
 * LocalStorage repository manager: loads or initializes seed data,
 * providing deterministic local workspace isolation.
 */
class LocalStorageRepository {
  private get<T>(table: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${table}`);
      if (!raw) {
        this.set(table, fallback);
        return fallback;
      }
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  private set<T>(table: string, data: T): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${table}`, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }

  // Workspaces & Profile
  getWorkspace(): Workspace {
    return this.get<Workspace>('workspace', INITIAL_WORKSPACE);
  }
  saveWorkspace(ws: Workspace): Workspace {
    this.set('workspace', ws);
    return ws;
  }

  getProfile(): Profile {
    return this.get<Profile>('profile', INITIAL_PROFILE);
  }
  saveProfile(p: Profile): Profile {
    this.set('profile', p);
    return p;
  }

  // Customers
  getCustomers(workspaceId?: string): Customer[] {
    const all = this.get<Customer[]>('customers', INITIAL_CUSTOMERS);
    return workspaceId ? all.filter((c) => c.workspace_id === workspaceId) : all;
  }
  saveCustomers(customers: Customer[]): void {
    this.set('customers', customers);
  }

  // Enquiries
  getEnquiries(workspaceId?: string): Enquiry[] {
    const all = this.get<Enquiry[]>('enquiries', INITIAL_ENQUIRIES);
    return workspaceId ? all.filter((e) => e.workspace_id === workspaceId) : all;
  }
  saveEnquiries(enquiries: Enquiry[]): void {
    this.set('enquiries', enquiries);
  }

  // Follow-ups
  getFollowUps(workspaceId?: string): FollowUp[] {
    const all = this.get<FollowUp[]>('follow_ups', INITIAL_FOLLOW_UPS);
    return workspaceId ? all.filter((f) => f.workspace_id === workspaceId) : all;
  }
  saveFollowUps(followUps: FollowUp[]): void {
    this.set('follow_ups', followUps);
  }

  // Appointments
  getAppointments(workspaceId?: string): Appointment[] {
    const all = this.get<Appointment[]>('appointments', INITIAL_APPOINTMENTS);
    return workspaceId ? all.filter((a) => a.workspace_id === workspaceId) : all;
  }
  saveAppointments(appointments: Appointment[]): void {
    this.set('appointments', appointments);
  }

  // Invoices
  getInvoices(workspaceId?: string): Invoice[] {
    const all = this.get<Invoice[]>('invoices', INITIAL_INVOICES);
    return workspaceId ? all.filter((i) => i.workspace_id === workspaceId) : all;
  }
  saveInvoices(invoices: Invoice[]): void {
    this.set('invoices', invoices);
  }

  // Payments
  getPayments(workspaceId?: string): Payment[] {
    const all = this.get<Payment[]>('payments', INITIAL_PAYMENTS);
    return workspaceId ? all.filter((p) => p.workspace_id === workspaceId) : all;
  }
  savePayments(payments: Payment[]): void {
    this.set('payments', payments);
  }

  // Communication logs
  getCommunications(customerId?: string): CommunicationLog[] {
    const all = this.get<CommunicationLog[]>('communication_logs', INITIAL_COMMUNICATION_LOGS);
    return customerId ? all.filter((c) => c.customer_id === customerId) : all;
  }
  saveCommunications(logs: CommunicationLog[]): void {
    this.set('communication_logs', logs);
  }

  // Inventory
  getInventory(workspaceId?: string): InventoryItem[] {
    const all = this.get<InventoryItem[]>('inventory', INITIAL_INVENTORY);
    return workspaceId ? all.filter((i) => i.workspace_id === workspaceId) : all;
  }
  getInventoryItem(id: string): InventoryItem | undefined {
    const all = this.getInventory();
    return all.find((i) => i.id === id);
  }
  saveInventory(items: InventoryItem[]): void {
    this.set('inventory', items);
  }
  updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem {
    const all = this.getInventory();
    const index = all.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Inventory item ${id} not found`);
    }
    const updated: InventoryItem = {
      ...all[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    all[index] = updated;
    this.saveInventory(all);
    return updated;
  }

  // Reset to initial seed state
  resetAll(): void {
    this.set('workspace', INITIAL_WORKSPACE);
    this.set('profile', INITIAL_PROFILE);
    this.set('customers', INITIAL_CUSTOMERS);
    this.set('enquiries', INITIAL_ENQUIRIES);
    this.set('follow_ups', INITIAL_FOLLOW_UPS);
    this.set('appointments', INITIAL_APPOINTMENTS);
    this.set('invoices', INITIAL_INVOICES);
    this.set('payments', INITIAL_PAYMENTS);
    this.set('communication_logs', INITIAL_COMMUNICATION_LOGS);
    this.set('inventory', INITIAL_INVENTORY);
  }
}

export const localDb = new LocalStorageRepository();
