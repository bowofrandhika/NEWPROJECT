/*
# Module A - Pre Production Checklist Schema

This migration implements Module A for pre-production activities.

## Changes Overview
1. Creates pre_production_checklist as parent for pre-production activities
2. Creates checklist_items for individual checklist items
3. Creates tools_inspection for tool/equipment checks
4. Creates manpower_records for attendance and manpower tracking

## New Tables
- `pre_production_checklist`: Main pre-production record per session
- `checklist_items`: Individual safety and operational check items
- `tools_inspection`: Equipment and tool inspection records
- `manpower_records`: Manpower attendance and assignment records

## Foreign Keys
- All tables reference production_sessions as parent
- Users referenced for created_by, operator_id fields

## Security
- RLS enabled on all tables
- Role-based policies for operators and supervisors
*/

-- Pre Production Checklist table
CREATE TABLE IF NOT EXISTS pre_production_checklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    checklist_date date NOT NULL,
    checked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status varchar(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(production_session_id)
);

-- Checklist Items table
CREATE TABLE IF NOT EXISTS checklist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_production_checklist_id uuid NOT NULL REFERENCES pre_production_checklist(id) ON DELETE CASCADE,
    item_code varchar(30),
    item_name varchar(100) NOT NULL,
    category varchar(50),
    is_checked boolean NOT NULL DEFAULT false,
    checked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    checked_at timestamptz,
    remarks text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Tools Inspection table
CREATE TABLE IF NOT EXISTS tools_inspection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    tool_code varchar(30),
    tool_name varchar(100) NOT NULL,
    category varchar(50),
    condition_status varchar(20) NOT NULL CHECK (condition_status IN ('GOOD', 'NEEDS_REPAIR', 'REPLACED', 'NOT_AVAILABLE')),
    inspected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    inspected_at timestamptz,
    remarks text,
    created_at timestamptz DEFAULT now()
);

-- Manpower Records table
CREATE TABLE IF NOT EXISTS manpower_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    operator_name varchar(100),
    position varchar(50),
    attendance_status varchar(20) NOT NULL DEFAULT 'PRESENT' CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'SICK')),
    clock_in_time timestamptz,
    clock_out_time timestamptz,
    assigned_area varchar(50),
    remarks text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pre_production_checklist_session ON pre_production_checklist(production_session_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_ppc ON checklist_items(pre_production_checklist_id);
CREATE INDEX IF NOT EXISTS idx_tools_inspection_session ON tools_inspection(production_session_id);
CREATE INDEX IF NOT EXISTS idx_manpower_records_session ON manpower_records(production_session_id);

-- Enable RLS
ALTER TABLE pre_production_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools_inspection ENABLE ROW LEVEL SECURITY;
ALTER TABLE manpower_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pre_production_checklist
DROP POLICY IF EXISTS "read_pre_production_checklist" ON pre_production_checklist;
CREATE POLICY "read_pre_production_checklist" ON pre_production_checklist FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_pre_production_checklist" ON pre_production_checklist;
CREATE POLICY "write_pre_production_checklist" ON pre_production_checklist FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- RLS Policies for checklist_items
DROP POLICY IF EXISTS "read_checklist_items" ON checklist_items;
CREATE POLICY "read_checklist_items" ON checklist_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_checklist_items" ON checklist_items;
CREATE POLICY "write_checklist_items" ON checklist_items FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for tools_inspection
DROP POLICY IF EXISTS "read_tools_inspection" ON tools_inspection;
CREATE POLICY "read_tools_inspection" ON tools_inspection FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_tools_inspection" ON tools_inspection;
CREATE POLICY "write_tools_inspection" ON tools_inspection FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for manpower_records
DROP POLICY IF EXISTS "read_manpower_records" ON manpower_records;
CREATE POLICY "read_manpower_records" ON manpower_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_manpower_records" ON manpower_records;
CREATE POLICY "write_manpower_records" ON manpower_records FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_pre_production_checklist ON pre_production_checklist;
CREATE TRIGGER audit_pre_production_checklist
    AFTER INSERT OR UPDATE OR DELETE ON pre_production_checklist
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_manpower_records ON manpower_records;
CREATE TRIGGER audit_manpower_records
    AFTER INSERT OR UPDATE OR DELETE ON manpower_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
