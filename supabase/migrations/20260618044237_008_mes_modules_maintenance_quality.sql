/*
# MES Modules - Maintenance, Quality, and OEE Schema

This migration implements new MES-level modules for maintenance, quality, and OEE tracking.

## Changes Overview
1. Creates maintenance management tables (preventive and corrective)
2. Creates quality management tables (inspection, defects, CAPA)
3. Creates OEE tracking tables
4. Creates batch traceability tables

## New Tables
Maintenance:
- `maintenance_schedules`: Preventive maintenance schedules
- `maintenance_records`: Maintenance execution records

Quality:
- `inspections`: Quality inspection records
- `defects`: Defect tracking
- `capa`: Corrective and Preventive Action management

OEE:
- `oee_records`: OEE calculation records
- `oee_targets`: OEE target configurations

Traceability:
- `batch_traceability`: Full batch traceability from material to pallet

## Security
- RLS enabled with appropriate role-based access
*/

-- Maintenance Schedules table (Preventive)
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_type varchar(50) NOT NULL,
    equipment_id uuid REFERENCES dryers(id) ON DELETE SET NULL,
    equipment_name varchar(100) NOT NULL,
    equipment_code varchar(50),
    maintenance_type varchar(30) NOT NULL CHECK (maintenance_type IN ('PREVENTIVE', 'PREDICTIVE', 'ROUTINE')),
    frequency varchar(30) NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    last_maintenance_date date,
    next_maintenance_date date NOT NULL,
    estimated_duration_hours integer DEFAULT 0,
    responsible_person_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    maintenance_procedure text,
    parts_required text,
    status varchar(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    priority varchar(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    downtime_id uuid REFERENCES downtime_records(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Maintenance Records table (Execution)
CREATE TABLE IF NOT EXISTS maintenance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_schedule_id uuid REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
    equipment_id uuid REFERENCES dryers(id) ON DELETE SET NULL,
    equipment_name varchar(100) NOT NULL,
    maintenance_type varchar(30) NOT NULL CHECK (maintenance_type IN ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'ROUTINE')),
    planned_start_date date,
    planned_end_date date,
    actual_start_date date,
    actual_end_date date,
    actual_duration_hours integer DEFAULT 0,
    performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at timestamptz,
    work_performed text,
    parts_used text,
    issues_found text,
    recommendations text,
    status varchar(20) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED')),
    cost numeric(12,2) DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Inspections table (Quality)
CREATE TABLE IF NOT EXISTS inspections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid REFERENCES production_sessions(id) ON DELETE CASCADE,
    pallet_tracking_id uuid REFERENCES pallet_tracking(id) ON DELETE SET NULL,
    inspection_type varchar(50) NOT NULL CHECK (inspection_type IN ('INCOMING', 'IN_PROCESS', 'FINAL', 'OUTGOING')),
    inspection_date date NOT NULL,
    inspected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    sample_qty integer NOT NULL DEFAULT 0 CHECK (sample_qty >= 0),
    passed_qty integer NOT NULL DEFAULT 0 CHECK (passed_qty >= 0),
    failed_qty integer NOT NULL DEFAULT 0 CHECK (failed_qty >= 0),
    pass_rate numeric(5,2) CHECK (pass_rate >= 0 AND pass_rate <= 100),
    inspection_result varchar(20) DEFAULT 'PENDING' CHECK (inspection_result IN ('PENDING', 'PASSED', 'FAILED', 'CONDITIONAL')),
    inspection_criteria text,
    observations text,
    inspector_notes text,
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at timestamptz,
    status varchar(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Defects table (Quality)
CREATE TABLE IF NOT EXISTS defects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id uuid REFERENCES inspections(id) ON DELETE CASCADE,
    production_session_id uuid REFERENCES production_sessions(id) ON DELETE SET NULL,
    defect_time timestamptz DEFAULT now(),
    defect_type varchar(50) NOT NULL,
    defect_category varchar(50),
    defect_severity varchar(20) DEFAULT 'MINOR' CHECK (defect_severity IN ('MINOR', 'MAJOR', 'CRITICAL')),
    defect_qty integer NOT NULL DEFAULT 0 CHECK (defect_qty >= 0),
    defect_description text,
    detected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    detected_location varchar(50),
    process_step varchar(50),
    root_cause text,
    corrective_action text,
    disposition varchar(30) CHECK (disposition IN ('ACCEPT', 'REJECT', 'REWORK', 'SCRAP', 'RETURN')),
    status varchar(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    resolution_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- CAPA table (Corrective and Preventive Action)
CREATE TABLE IF NOT EXISTS capa (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_number varchar(30) NOT NULL UNIQUE,
    defect_id uuid REFERENCES defects(id) ON DELETE SET NULL,
    reject_record_id uuid REFERENCES reject_records(id) ON DELETE SET NULL,
    capa_type varchar(30) NOT NULL CHECK (capa_type IN ('CORRECTIVE', 'PREVENTIVE', 'BOTH')),
    source varchar(50)
    CHECK (source IN ('CUSTOMER_COMPLAINT', 'INTERNAL_AUDIT', 'INSPECTION', 'PROCESS_DEVIATION', 'REJECT_ANALYSIS')),
    problem_statement text NOT NULL,
    root_cause_analysis text,
    immediate_action text,
    long_term_action text,
    preventive_action text,
    responsible_person_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date date,
    completion_date date,
    effectiveness_check_date date,
    effectiveness_result varchar(30) CHECK (effectiveness_result IN ('NOT_EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'EFFECTIVE', 'VERIFIED')),
    status varchar(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'IMPLEMENTED', 'VERIFIED', 'CLOSED', 'CANCELLED')),
    verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at timestamptz,
    verification_notes text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- OEE Records table
CREATE TABLE IF NOT EXISTS oee_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    line_id uuid REFERENCES lines(id) ON DELETE SET NULL,
    calculation_date date NOT NULL,
    shift_id uuid REFERENCES shifts(id) ON DELETE SET NULL,
    -- Time components
    planned_production_time_minutes integer NOT NULL DEFAULT 0 CHECK (planned_production_time_minutes >= 0),
    operating_time_minutes integer NOT NULL DEFAULT 0 CHECK (operating_time_minutes >= 0),
    run_time_minutes integer NOT NULL DEFAULT 0 CHECK (run_time_minutes >= 0),
    ideal_run_rate numeric(10,2) DEFAULT 0 CHECK (ideal_run_rate >= 0),
    -- Production components
    total_output integer NOT NULL DEFAULT 0 CHECK (total_output >= 0),
    good_output integer NOT NULL DEFAULT 0 CHECK (good_output >= 0),
    defect_output integer NOT NULL DEFAULT 0 CHECK (defect_output >= 0),
    -- Calculated metrics
    availability numeric(5,2) CHECK (availability >= 0 AND availability <= 100),
    performance numeric(5,2) CHECK (performance >= 0 AND performance <= 100),
    quality numeric(5,2) CHECK (quality >= 0 AND quality <= 100),
    oee numeric(5,2) CHECK (oee >= 0 AND oee <= 100),
    -- Downtime summary
    planned_downtime_minutes integer DEFAULT 0 CHECK (planned_downtime_minutes >= 0),
    unplanned_downtime_minutes integer DEFAULT 0 CHECK (unplanned_downtime_minutes >= 0),
    -- Speed loss
    speed_loss_minutes integer DEFAULT 0 CHECK (speed_loss_minutes >= 0),
    -- Calculated at and by
    calculated_at timestamptz DEFAULT now(),
    calculated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- OEE Targets table
CREATE TABLE IF NOT EXISTS oee_targets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id uuid REFERENCES lines(id) ON DELETE SET NULL,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    target_availability numeric(5,2) DEFAULT 85.00 CHECK (target_availability >= 0 AND target_availability <= 100),
    target_performance numeric(5,2) DEFAULT 90.00 CHECK (target_performance >= 0 AND target_performance <= 100),
    target_quality numeric(5,2) DEFAULT 95.00 CHECK (target_quality >= 0 AND target_quality <= 100),
    target_oee numeric(5,2) DEFAULT 77.00 CHECK (target_oee >= 0 AND target_oee <= 100),
    effective_from date NOT NULL,
    effective_to date,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Batch Traceability table
CREATE TABLE IF NOT EXISTS batch_traceability (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    work_order_id uuid REFERENCES work_orders(id) ON DELETE SET NULL,
    batch_code varchar(50) NOT NULL,
    parent_batch_id uuid REFERENCES batch_traceability(id) ON DELETE SET NULL,
    -- Material inputs
    material_id uuid REFERENCES material_identification(id) ON DELETE SET NULL,
    input_qty numeric(10,2) DEFAULT 0 CHECK (input_qty >= 0),
    input_date timestamptz,
    -- Process tracking
    process_step varchar(50),
    line_id uuid REFERENCES lines(id) ON DELETE SET NULL,
    dryer_id uuid REFERENCES dryers(id) ON DELETE SET NULL,
    dryer_cycle integer,
    trolley_id uuid REFERENCES trolleys(id) ON DELETE SET NULL,
    -- Output tracking
    output_qty numeric(10,2) DEFAULT 0 CHECK (output_qty >= 0),
    output_date timestamptz,
    pallet_tracking_id uuid REFERENCES pallet_tracking(id) ON DELETE SET NULL,
    -- Quality
    quality_status varchar(20) CHECK (quality_status IN ('PENDING', 'APPROVED', 'REJECTED', 'HOLD')),
    inspection_id uuid REFERENCES inspections(id) ON DELETE SET NULL,
    -- Traceability
    trace_from text[],
    trace_to text[],
    -- Audit
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_equipment ON maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_date ON maintenance_schedules(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_equipment ON maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_inspections_session ON inspections(production_session_id);
CREATE INDEX IF NOT EXISTS idx_inspections_pallet ON inspections(pallet_tracking_id);
CREATE INDEX IF NOT EXISTS idx_defects_inspection ON defects(inspection_id);
CREATE INDEX IF NOT EXISTS idx_capa_defect ON capa(defect_id);
CREATE INDEX IF NOT EXISTS idx_oee_records_session ON oee_records(production_session_id);
CREATE INDEX IF NOT EXISTS idx_oee_records_date ON oee_records(calculation_date);
CREATE INDEX IF NOT EXISTS idx_batch_traceability_session ON batch_traceability(production_session_id);
CREATE INDEX IF NOT EXISTS idx_batch_traceability_batch ON batch_traceability(batch_code);

-- Enable RLS
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE capa ENABLE ROW LEVEL SECURITY;
ALTER TABLE oee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE oee_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_traceability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance tables
DROP POLICY IF EXISTS "read_maintenance_schedules" ON maintenance_schedules;
CREATE POLICY "read_maintenance_schedules" ON maintenance_schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_maintenance_schedules" ON maintenance_schedules;
CREATE POLICY "write_maintenance_schedules" ON maintenance_schedules FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

DROP POLICY IF EXISTS "read_maintenance_records" ON maintenance_records;
CREATE POLICY "read_maintenance_records" ON maintenance_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_maintenance_records" ON maintenance_records;
CREATE POLICY "write_maintenance_records" ON maintenance_records FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- RLS Policies for quality tables
DROP POLICY IF EXISTS "read_inspections" ON inspections;
CREATE POLICY "read_inspections" ON inspections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_inspections" ON inspections;
CREATE POLICY "write_inspections" ON inspections FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

DROP POLICY IF EXISTS "read_defects" ON defects;
CREATE POLICY "read_defects" ON defects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_defects" ON defects;
CREATE POLICY "write_defects" ON defects FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

DROP POLICY IF EXISTS "read_capa" ON capa;
CREATE POLICY "read_capa" ON capa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_capa" ON capa;
CREATE POLICY "write_capa" ON capa FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- RLS Policies for OEE tables
DROP POLICY IF EXISTS "read_oee_records" ON oee_records;
CREATE POLICY "read_oee_records" ON oee_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_oee_records" ON oee_records;
CREATE POLICY "write_oee_records" ON oee_records FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

DROP POLICY IF EXISTS "read_oee_targets" ON oee_targets;
CREATE POLICY "read_oee_targets" ON oee_targets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_oee_targets" ON oee_targets;
CREATE POLICY "write_oee_targets" ON oee_targets FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

-- RLS Policies for batch_traceability
DROP POLICY IF EXISTS "read_batch_traceability" ON batch_traceability;
CREATE POLICY "read_batch_traceability" ON batch_traceability FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_batch_traceability" ON batch_traceability;
CREATE POLICY "write_batch_traceability" ON batch_traceability FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_maintenance_records ON maintenance_records;
CREATE TRIGGER audit_maintenance_records
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_inspections ON inspections;
CREATE TRIGGER audit_inspections
    AFTER INSERT OR UPDATE OR DELETE ON inspections
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_capa ON capa;
CREATE TRIGGER audit_capa
    AFTER INSERT OR UPDATE OR DELETE ON capa
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
