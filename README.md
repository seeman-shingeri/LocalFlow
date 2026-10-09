# LocalFlow AI - AI-Powered Customer Follow-Up & Business Management SaaS

LocalFlow AI is a practical, production-oriented SaaS platform engineered for small service businesses (e.g. HVAC, plumbing, electricians, auto detailing, contractors, home services, digital agencies) to centralize customer enquiries, follow-ups, appointments, invoices, payment records, and AI-assisted client communications.

---

## Key Features

### 1. Multi-Tenant Business Workspaces & Security
* Multi-tenant data model with workspace isolation (`workspace_id`).
* Full PostgreSQL Row-Level Security (RLS) policies defined in [`supabase/migrations/20250101000000_localflow_schema.sql`](file:///c:/Users/CITYcomp/Desktop/LocalFlow/supabase/migrations/20250101000000_localflow_schema.sql).
* Supabase Auth integration with seamless local storage workspace fallback for instant evaluation.
* Business profile management (name, category, contact, currency, timezone).

### 2. Customer 360 CRM
* Create, edit, search, filter, and archive customer accounts.
* Real-time duplicate customer detection (flags matching email or phone numbers).
* 360-degree timeline profile drawer displaying linked enquiries, appointments, invoices, payments, and communication logs.

### 3. Enquiry Sales Pipeline
* Visual Kanban board and list view for deal progression:
  * `New Lead` ➔ `Contacted` ➔ `Interested / Quoted` ➔ `Converted (Won)` / `Not Converted (Lost)`.
* Track estimated deal values, service types, and deal win rates.

### 4. Dedicated "Follow-ups Today" Engine
* Never lose an inbound lead or forget a quote review.
* Categorized views for **Overdue**, **Due Today**, **Upcoming**, and **Completed** tasks.
* Actions: 1-click completion with outcome note, quick reschedule modal (+1 day, +3 days, next week), and AI-assisted draft generation.
* Automatically syncs customer `last_contact_date` and `next_follow_up_date`.

### 5. Service Appointments
* Agenda and calendar list views with timezone awareness.
* Status tracking (`scheduled`, `completed`, `cancelled`, `rescheduled`).
* Duration calculation and service location tracking.

### 6. Itemized Invoicing & Payment Ledger
* Create itemized invoices with dynamic line items, automated subtotals, tax calculation, and total amounts.
* Partial payment recording: records payments separately with payment method (`card`, `bank_transfer`, `cash`, `other`), transaction reference, and notes.
* Real-time ledger updates: updates invoice `paid_amount`, `balance_due`, and status (`draft`, `sent`, `partial`, `paid`, `overdue`).
* Clean printable/PDF-ready invoice statement view.

### 7. AI Business Assistant & Communication Drafter
* **Factual & Deterministic**: Uses deterministic code and database queries for all counts, monetary totals, and balances.
* **Context-Aware Message Drafter**: Generates personalized SMS, WhatsApp, and email messages for follow-ups, quote check-ins, payment reminders, and appointment confirmations.
* **Safe Delivery Interface**: Copyable drafts with 1-click clipboard copy and communication history logging. Never claims external delivery when only generating drafts.
* **Graceful Degradation**: Works out-of-the-box with smart rule-based templates if `VITE_GEMINI_API_KEY` is not configured, and activates Google Gemini 1.5 Flash when the API key is present.

### 8. Real-Time Business Dashboard
* Live KPI cards: Total Customers, Active Pipeline Value, Follow-ups Due Today, Overdue Follow-ups, Upcoming Appointments, Total Outstanding Receivables, Collected Revenue, and Win Rate.
* Recent daily revenue collection chart.
* Pipeline stage distribution chart and recent activity feed.

---

## Technology Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
* **Icons**: Lucide React
* **Charts**: Recharts
* **Dates**: date-fns
* **Backend / Database**: Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS)
* **Testing**: Vitest, React Testing Library, jsdom

---

## Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Supabase Configuration (Optional for local test mode)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Assistant Key (Optional)
VITE_GEMINI_API_KEY=your-gemini-api-key
```
> **Note**: If Supabase variables are left empty, the application automatically runs in **Local Workspace Mode**, using local storage with realistic sample data for full offline evaluation.

### 3. Supabase Database Migration
When connecting to a Supabase project:
1. Open the Supabase dashboard -> **SQL Editor**.
2. Run the migration file located at:
   `supabase/migrations/20250101000000_localflow_schema.sql`
3. This creates all 12 tables, indexes, RLS policies, and balance recalculation triggers.

### 4. Running the Development Server
```bash
npm run dev
```

### 5. Running Tests
```bash
npm run test
```

### 6. Building for Production
```bash
npm run build
```

---

## Architecture & Code Structure

```
src/
├── types/          # TypeScript domain models (database.ts)
├── lib/            # Utilities (utils.ts), Supabase client (supabase.ts), local store (localStorageDb.ts)
├── context/        # AuthContext.tsx, WorkspaceContext.tsx
├── services/       # customerService, enquiryService, followUpService, appointmentService, invoiceService, paymentService, analyticsService, commsService, aiService
├── components/
│   ├── ui/         # Button, Input, Modal, Select, Textarea, Badge, Card, EmptyState, ConfirmationModal
│   ├── layout/     # AppLayout, Sidebar, Navbar
│   ├── customer/   # CustomerFormModal, CustomerDetailDrawer
│   ├── enquiry/    # EnquiryPipeline, EnquiryFormModal
│   ├── followUp/   # FollowUpList, FollowUpFormModal, RescheduleModal
│   ├── appointment/# AppointmentList, AppointmentFormModal
│   ├── invoice/    # InvoiceList, InvoiceFormModal, RecordPaymentModal, PrintableInvoiceModal
│   ├── ai/         # AIAssistantPanel, AIDraftModal
│   └── dashboard/  # StatCard, RevenueChart, FollowUpsDueWidget
├── pages/          # LoginPage, SignupPage, ResetPasswordPage, DashboardPage, CustomersPage, EnquiriesPage, FollowUpsPage, AppointmentsPage, InvoicesPage, AIAssistantPage, SettingsPage, NotFoundPage
└── test/           # invoiceCalculation.test.ts, followUpFiltering.test.ts, metricsCalculation.test.ts
```
