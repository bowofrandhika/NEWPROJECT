/*
# Module B - Production Process Schema

This migration implements Module B for production process activities.

## Changes Overview
1. Creates production_logs for detailed production time logs
2. Creates material_identification for material tracking
3. Creates process_flow_control for process step tracking
4. Creates output_summary for production output summary
5. Creates fuel_consumption for fuel usage tracking

## New Tables
- `production_logs`: Detailed time-based production logs
- `material_identification`: Material identification and tracking
- `process_flow_control`: Process flow step tracking
- `output_summary`: Production output summaries
- `fuel_consumption`: Fuel consumption records

## Foreign Keys
- All tables reference production_sessions as parent
- Created_by references auth.users

## Security
- RLS enabled with operator-level access
*/

-- Production Logs table
CREATE TABLE IF NOT EXISTS production_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    log_time timestamptz NOT NULL DEFAULT now(),
    process_step varchar(50),
    input_qty integer NOT NULL DEFAULT 0 CHECK (input_qty >= 0),
    output_qty integer NOT NULL DEFAULT 0 CHECK (output_qty >= 0),
    reject_qty integer NOT NULL DEFAULT 0 CHECK (reject_qty >= 0),
    operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    remarks text,
    created_at timestamptz DEFAULT now()
);

-- Material Identification table
CREATE TABLE IF NOT EXISTS material_identification (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    material_code varchar(50) NOT NULL,
    material_name varchar(100) NOT NULL,
    batch_number varchar(50),
    supplier varchar(100),
    received_qty numeric(10,2) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
    used_qty numeric(10,2) NOT NULL DEFAULT 0 CHECK (used_qty >= 0),
    unit varchar(20) DEFAULT 'KG',
    identification_status varchar(20) NOT NULL DEFAULT 'VERIFIED' CHECK (identification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    identified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    identified_at timestamptz,
    expiry_date date,
    storage_location varchar(50),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Process Flow Control table
CREATE TABLE IF NOT EXISTS process_flow_control (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    process_step varchar(50) NOT NULL,
    step_order integer NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'ON_HOLD')),
    start_time timestamptz,
    end_time timestamptz,
    duration_minutes integer,
    operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    temperature numeric(5,2),
    humidity numeric(5,2),
    pressure numeric(8,2),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Output Summary table
CREATE TABLE IF NOT EXISTS output_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    summary_date date NOT NULL,
    total_input integer NOT NULL DEFAULT 0 CHECK (total_input >= 0),
    total_output integer NOT NULL DEFAULT 0 CHECK (total_output >= 0),
    total_good integer NOT NULL DEFAULT 0 CHECK (total_good >= 0),
    total_reject integer NOT NULL DEFAULT 0 CHECK (total_reject >= 0),
    total_rework integer NOT NULL DEFAULT 0 CHECK (total_rework >= 0),
    efficiency numeric(5,2),
    yield_percentage numeric(5,2),
    recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status varchar(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(production_session_id, summary_date)
);

-- Fuel Consumption table
CREATE TABLE IF NOT EXISTS fuel_consumption (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    fuel_type varchar(30) NOT NULL,
    opening_stock numeric(10,2) NOT NULL DEFAULT 0 CHECK (opening_stock >= 0),
    received_qty numeric(10,2) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
    consumed_qty numeric(10,2) NOT NULL DEFAULT 0 CHECK (consumed_qty >= 0),
    closing_stock numeric(10,2) NOT NULL DEFAULT 0 CHECK (closing_stock >= 0),
    unit varchar(20) DEFAULT 'LITER',
    consumption_date date NOT NULL,
    recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_production_logs_session ON production_logs(production_session_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_time ON production_logs(log_time);
CREATE INDEX IF NOT EXISTS idx_material_identification_session ON material_identification(production_session_id);
CREATE INDEX IF NOT EXISTS idx_process_flow_session ON process_flow_control(production_session_id);
CREATE INDEX IF NOT EXISTS idx_output_summary_session ON output_summary(production_session_id);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_session ON fuel_consumption(production_session_id);

-- Enable RLS
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_identification ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_flow_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE output_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_consumption ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_logs
DROP POLICY IF EXISTS "read_production_logs" ON production_logs;
CREATE POLICY "read_production_logs" ON production_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_production_logs" ON production_logs;
CREATE POLICY "write_production_logs" ON production_logs FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for material_identification
DROP POLICY IF EXISTS "read_material_identification" ON material_identification;
CREATE POLICY "read_material_identification" ON material_identification FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_material_identification" ON material_identification;
CREATE POLICY "write_material_identification" ON material_identification FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for process_flow_control
DROP POLICY IF EXISTS "read_process_flow_control" ON process_flow_control;
CREATE POLICY "read_process_flow_control" ON process_flow_control FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_process_flow_control" ON process_flow_control;
CREATE POLICY "write_process_flow_control" ON process_flow_control FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for output_summary
DROP POLICY IF EXISTS "read_output_summary" ON output_summary;
CREATE POLICY "read_output_summary" ON output_summary FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_output_summary" ON output_summary;
CREATE POLICY "write_output_summary" ON output_summary FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- RLS Policies for fuel_consumption
DROP POLICY IF EXISTS "read_fuel_consumption" ON fuel_consumption;
CREATE POLICY "read_fuel_consumption" ON fuel_consumption FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_fuel_consumption" ON fuel_consumption;
CREATE POLICY "write_fuel_consumption" ON fuel_consumption FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_production_logs ON production_logs;
CREATE TRIGGER audit_production_logs
    AFTER INSERT OR UPDATE OR DELETE ON production_logs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_output_summary ON output_summary;
CREATE TRIGGER audit_output_summary
    AFTER INSERT OR UPDATE OR DELETE ON output_summary
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
