-- Migration: Schema Changes for RBAC, User Management, WO/DI Fields, Checklist, Production Log

-- 1. Add photo_url to app_users
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Add new columns to work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS buyer varchar(20);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS deadline_date date;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS packaging varchar(10);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quantity_kg numeric NOT NULL DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completed_kg numeric NOT NULL DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS notification_sent boolean NOT NULL DEFAULT false;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS wo_completion_confirmed boolean NOT NULL DEFAULT false;

-- 3. Add new columns to production_sessions
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS shift varchar(20);
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS line varchar(10);
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS packaging varchar(10);
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS production_target_kg numeric NOT NULL DEFAULT 0;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS actual_production_kg numeric NOT NULL DEFAULT 0;

-- 4. Create session_checklist_items table (Pre-Production Checklist with OK/NG)
CREATE TABLE IF NOT EXISTS session_checklist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    item_name varchar(100) NOT NULL,
    initial_condition varchar(10) CHECK (initial_condition IN ('OK', 'NG')),
    final_condition varchar(10) CHECK (final_condition IN ('OK', 'NG')),
    initial_remarks text,
    final_remarks text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_checklist_items_session ON session_checklist_items(production_session_id);

-- 5. Create production_log_details table (Production Log multi-tab data)
CREATE TABLE IF NOT EXISTS production_log_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    -- Tab 1: Session
    foreman_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
    production_start_time timestamptz,
    production_end_time timestamptz,
    -- Tab 2: Material
    material_room varchar(50),
    material_deck varchar(50),
    material_update_date date,
    material_drying_time_days integer,
    material_visual_condition varchar(20) CHECK (material_visual_condition IN ('Clean', 'Moderate', 'Dirty')),
    material_line_cleaning varchar(20) CHECK (material_line_cleaning IN ('Clean', 'Moderate', 'Dirty')),
    material_remarks text,
    -- Tab 3: Process Flow
    avg_cake_weight numeric,
    variation varchar(100),
    process_remarks text,
    bale_count integer NOT NULL DEFAULT 0,
    pallet_count integer NOT NULL DEFAULT 0,
    total_weight_kg numeric NOT NULL DEFAULT 0,
    -- Tab 4: Fuel
    diesel_start_l numeric,
    diesel_end_l numeric,
    diesel_consumption_l numeric,
    pks_consumption_kg numeric,
    -- Meta
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(production_session_id)
);

CREATE INDEX IF NOT EXISTS idx_production_log_details_session ON production_log_details(production_session_id);

-- 6. Create wo_completion_notifications table
CREATE TABLE IF NOT EXISTS wo_completion_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wo_notifications_wo ON wo_completion_notifications(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_notifications_unread ON wo_completion_notifications(is_read) WHERE is_read = false;

-- Enable RLS on new tables
ALTER TABLE session_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_log_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_completion_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_checklist_items
DROP POLICY IF EXISTS "read_session_checklist_items" ON session_checklist_items;
CREATE POLICY "read_session_checklist_items" ON session_checklist_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_session_checklist_items" ON session_checklist_items;
CREATE POLICY "write_session_checklist_items" ON session_checklist_items FOR ALL
TO authenticated USING (has_role('MANDOR'::user_role)) WITH CHECK (has_role('MANDOR'::user_role));

-- RLS Policies for production_log_details
DROP POLICY IF EXISTS "read_production_log_details" ON production_log_details;
CREATE POLICY "read_production_log_details" ON production_log_details FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_production_log_details" ON production_log_details;
CREATE POLICY "write_production_log_details" ON production_log_details FOR ALL
TO authenticated USING (has_role('MANDOR'::user_role)) WITH CHECK (has_role('MANDOR'::user_role));

-- RLS Policies for wo_completion_notifications
DROP POLICY IF EXISTS "read_wo_notifications" ON wo_completion_notifications;
CREATE POLICY "read_wo_notifications" ON wo_completion_notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_wo_notifications" ON wo_completion_notifications;
CREATE POLICY "write_wo_notifications" ON wo_completion_notifications FOR ALL
TO authenticated USING (has_role('ADMIN'::user_role)) WITH CHECK (has_role('ADMIN'::user_role));

-- Update has_role function to include SUPER_USER
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS boolean AS $$
DECLARE
    user_role_var user_role;
BEGIN
    SELECT role INTO user_role_var FROM app_users WHERE user_id = auth.uid();
    IF user_role_var IS NULL THEN RETURN false; END IF;

    -- Role hierarchy: SUPER_USER > ADMIN > SPV > MANDOR > OPERATOR
    CASE required_role
        WHEN 'SUPER_USER' THEN RETURN user_role_var = 'SUPER_USER';
        WHEN 'ADMIN' THEN RETURN user_role_var IN ('SUPER_USER', 'ADMIN');
        WHEN 'SPV' THEN RETURN user_role_var IN ('SUPER_USER', 'ADMIN', 'SPV');
        WHEN 'MANDOR' THEN RETURN user_role_var IN ('SUPER_USER', 'ADMIN', 'SPV', 'MANDOR');
        WHEN 'DRYER_OPERATOR' THEN RETURN true;
        WHEN 'PACKING_OPERATOR' THEN RETURN true;
        ELSE RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update app_users RLS policies to allow SUPER_USER full access
DROP POLICY IF EXISTS "superusers_read_all_profiles" ON app_users;
CREATE POLICY "superusers_read_all_profiles"
ON app_users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'SUPER_USER'
    )
);

DROP POLICY IF EXISTS "superusers_insert_users" ON app_users;
CREATE POLICY "superusers_insert_users"
ON app_users FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'SUPER_USER'
    )
);

DROP POLICY IF EXISTS "superusers_delete_users" ON app_users;
CREATE POLICY "superusers_delete_users"
ON app_users FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'SUPER_USER'
    )
);

DROP POLICY IF EXISTS "superusers_update_users" ON app_users;
CREATE POLICY "superusers_update_users"
ON app_users FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'SUPER_USER'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'SUPER_USER'
    )
);

-- Add trigger for updated_at on new tables
DROP TRIGGER IF EXISTS update_session_checklist_items_updated_at ON session_checklist_items;
CREATE TRIGGER update_session_checklist_items_updated_at
    BEFORE UPDATE ON session_checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_log_details_updated_at ON production_log_details;
CREATE TRIGGER update_production_log_details_updated_at
    BEFORE UPDATE ON production_log_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
