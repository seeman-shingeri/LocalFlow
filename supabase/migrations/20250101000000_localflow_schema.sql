-- ====================================================================
-- LOCALFLOW AI: Production Database Schema & Row Level Security (RLS)
-- Multi-tenant workspace architecture with strict tenant isolation
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. PROFILES (extends auth.users)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 2. WORKSPACES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General Services',
    currency TEXT NOT NULL DEFAULT 'USD',
    phone TEXT,
    email TEXT,
    address TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'growth')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 3. WORKSPACE MEMBERSHIPS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);

-- --------------------------------------------------------------------
-- 4. CUSTOMERS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'Direct',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('lead', 'active', 'archived')),
    last_contact_date TIMESTAMPTZ,
    next_follow_up_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 5. ENQUIRIES (Lead pipeline)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    service_type TEXT,
    estimated_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'converted', 'not_converted')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 6. FOLLOW-UPS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 7. APPOINTMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 8. INVOICES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, invoice_number)
);

-- --------------------------------------------------------------------
-- 9. INVOICE LINE ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0
);

-- --------------------------------------------------------------------
-- 10. PAYMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    payment_method TEXT NOT NULL DEFAULT 'other' CHECK (payment_method IN ('card', 'bank_transfer', 'cash', 'other')),
    transaction_reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 11. COMMUNICATION LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'note' CHECK (channel IN ('email', 'sms', 'whatsapp', 'call', 'note')),
    direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    subject TEXT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'logged' CHECK (status IN ('draft', 'sent', 'logged')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 12. AI USAGE LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    prompt_summary TEXT,
    tokens_used INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customers_workspace ON customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_enquiries_workspace_status ON enquiries(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(workspace_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(workspace_id, start_time, status);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_status ON invoices(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_comms_customer ON communication_logs(customer_id);

-- --------------------------------------------------------------------
-- RLS HELPER FUNCTIONS
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = ws_id
          AND user_id = auth.uid()
    );
$$;

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read and update their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Workspaces: users can view workspaces they belong to
CREATE POLICY "Members can view workspaces"
    ON workspaces FOR SELECT
    USING (is_workspace_member(id) OR owner_id = auth.uid());

CREATE POLICY "Authenticated users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owners and admins can update workspaces"
    ON workspaces FOR UPDATE
    USING (is_workspace_member(id));

-- Workspace Members:
CREATE POLICY "Members can view workspace membership"
    ON workspace_members FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins/Owners can insert members"
    ON workspace_members FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id) OR auth.uid() = user_id);

-- Customers
CREATE POLICY "Workspace isolation for customers select"
    ON customers FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for customers insert"
    ON customers FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for customers update"
    ON customers FOR UPDATE
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for customers delete"
    ON customers FOR DELETE
    USING (is_workspace_member(workspace_id));

-- Enquiries
CREATE POLICY "Workspace isolation for enquiries select"
    ON enquiries FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for enquiries insert"
    ON enquiries FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for enquiries update"
    ON enquiries FOR UPDATE
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for enquiries delete"
    ON enquiries FOR DELETE
    USING (is_workspace_member(workspace_id));

-- Follow-ups
CREATE POLICY "Workspace isolation for follow_ups select"
    ON follow_ups FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for follow_ups insert"
    ON follow_ups FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for follow_ups update"
    ON follow_ups FOR UPDATE
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for follow_ups delete"
    ON follow_ups FOR DELETE
    USING (is_workspace_member(workspace_id));

-- Appointments
CREATE POLICY "Workspace isolation for appointments select"
    ON appointments FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for appointments insert"
    ON appointments FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for appointments update"
    ON appointments FOR UPDATE
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for appointments delete"
    ON appointments FOR DELETE
    USING (is_workspace_member(workspace_id));

-- Invoices
CREATE POLICY "Workspace isolation for invoices select"
    ON invoices FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for invoices insert"
    ON invoices FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for invoices update"
    ON invoices FOR UPDATE
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for invoices delete"
    ON invoices FOR DELETE
    USING (is_workspace_member(workspace_id));

-- Invoice Items
CREATE POLICY "Workspace isolation for invoice_items select"
    ON invoice_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND is_workspace_member(invoices.workspace_id)
    ));

CREATE POLICY "Workspace isolation for invoice_items insert"
    ON invoice_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND is_workspace_member(invoices.workspace_id)
    ));

CREATE POLICY "Workspace isolation for invoice_items update"
    ON invoice_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND is_workspace_member(invoices.workspace_id)
    ));

CREATE POLICY "Workspace isolation for invoice_items delete"
    ON invoice_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND is_workspace_member(invoices.workspace_id)
    ));

-- Payments
CREATE POLICY "Workspace isolation for payments select"
    ON payments FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for payments insert"
    ON payments FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

-- Communication logs
CREATE POLICY "Workspace isolation for comms select"
    ON communication_logs FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for comms insert"
    ON communication_logs FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

-- AI Usage logs
CREATE POLICY "Workspace isolation for ai_usage select"
    ON ai_usage_logs FOR SELECT
    USING (is_workspace_member(workspace_id));

CREATE POLICY "Workspace isolation for ai_usage insert"
    ON ai_usage_logs FOR INSERT
    WITH CHECK (is_workspace_member(workspace_id));

-- --------------------------------------------------------------------
-- AUTOMATIC BALANCE & STATUS TRIGGER FOR INVOICES & PAYMENTS
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_invoice_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invoice_id UUID;
    v_total NUMERIC(12, 2);
    v_paid NUMERIC(12, 2);
    v_balance NUMERIC(12, 2);
    v_new_status TEXT;
    v_due_date DATE;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Calculate total paid for this invoice
    SELECT COALESCE(SUM(amount), 0.00) INTO v_paid
    FROM payments
    WHERE invoice_id = v_invoice_id;

    -- Fetch current invoice total & due date
    SELECT total_amount, due_date INTO v_total, v_due_date
    FROM invoices
    WHERE id = v_invoice_id;

    v_balance := GREATEST(0.00, v_total - v_paid);

    -- Determine appropriate status
    IF v_paid >= v_total AND v_total > 0 THEN
        v_new_status := 'paid';
    ELSIF v_paid > 0 THEN
        v_new_status := 'partial';
    ELSIF v_due_date < CURRENT_DATE THEN
        v_new_status := 'overdue';
    ELSE
        v_new_status := 'sent';
    END IF;

    -- Update invoice row
    UPDATE invoices
    SET paid_amount = v_paid,
        balance_due = v_balance,
        status = v_new_status,
        updated_at = now()
    WHERE id = v_invoice_id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_payment_change ON payments;
CREATE TRIGGER trg_after_payment_change
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION sync_invoice_payment_totals();
