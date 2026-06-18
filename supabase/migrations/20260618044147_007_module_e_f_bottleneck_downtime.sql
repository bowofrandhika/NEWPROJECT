/*
# Module E & F - Bottleneck and Downtime Management Schema

This migration implements Module E (Bottleneck) and Module F (Downtime) management.

## Changes Overview
1. Creates bottleneck_records for bottleneck identification and tracking
2. Creates corrective_actions for corrective action management
3. Creates downtime_records for downtime tracking
4. Creates root_causes for root cause analysis

## New Tables
- `bottleneck_records`: Bottleneck identification and tracking
- `corrective_actions`: Corrective action management
- `downtime_records`: Downtime tracking with categories
- `root_causes`: Root cause analysis

## Foreign Keys
- All tables reference production_sessions as parent
- Corrective actions can link to bottleneck and downtime records

## Security
- RLS enabled with operator-level access
*/

-- Bottleneck Records table
CREATE TABLE IF NOT EXISTS bottleneck_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    bottleneck_time timestamptz NOT NULL DEFAULT now(),
    bottleneck_type varchar(50) NOT NULL,
    bottleneck_category varchar(50),
    location varchar(50),
    process_step varchar(50),
    severity varchar(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    impact_duration_minutes integer NOT NULL DEFAULT 0 CHECK (impact_duration_minutes >= 0),
    affected_qty integer DEFAULT 0 CHECK (affected_qty >= 0),
    description text,
    identified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status varchar(20) DEFAULT 'IDENTIFIED' CHECK (status IN ('IDENTIFIED', 'IN_PROGRESS', 'RESOLVED', 'MONITORING')),
    resolved_at timestamptz,
    resolution_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Corrective Actions table
CREATE TABLE IF NOT EXISTS corrective_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bottleneck_record_id uuid REFERENCES bottleneck_records(id) ON DELETE SET NULL,
    downtime_record_id uuid,
    action_number varchar(30) NOT NULL UNIQUE,
    action_type varchar(50) NOT NULL,
    action_description text NOT NULL,
    root_cause varchar(100),
    responsible_person_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date date,
    priority varchar(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status varchar(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED')),
    completed_at timestamptz,
    completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at timestamptz,
    verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    effectiveness varchar(20) CHECK (effectiveness IN ('INEFFECTIVE', 'PARTIAL', 'EFFECTIVE', 'VERY_EFFECTIVE')),
    follow_up_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Downtime Records table
CREATE TABLE IF NOT EXISTS downtime_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    downtime_start timestamptz NOT NULL,
    downtime_end timestamptz,
    downtime_minutes integer NOT NULL DEFAULT 0 CHECK (downtime_minutes >= 0),
    downtime_type varchar(50) NOT NULL,
    downtime_category varchar(50),
    equipment_id uuid REFERENCES dryers(id) ON DELETE SET NULL,
    equipment_name varchar(100),
    location varchar(50),
    reason text,
    impact_description text,
    reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at timestamptz,
    status varchar(20) DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    resolution_description text,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Root Causes table (for detailed root cause analysis)
CREATE TABLE IF NOT EXISTS root_causes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    downtime_record_id uuid REFERENCES downtime_records(id) ON DELETE CASCADE,
    bottleneck_record_id uuid REFERENCES bottleneck_records(id) ON DELETE CASCADE,
    root_cause_category varchar(50),
    root_cause_description text NOT NULL,
    contributing_factors text,
    analysis_method varchar(50) CHECK (analysis_method IN ('5_WHYS', 'FISHBONE', 'FAULT_TREE', 'OTHER')),
   分析方法_details text,
    analyzed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    analyzed_at timestamptz,
    preventive_action text,
    created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bottleneck_records_session ON bottleneck_records(production_session_id);
CREATE INDEX IF NOT EXISTS idx_bottleneck_records_time ON bottleneck_records(bottleneck_time);
CREATE INDEX IF NOT EXISTS idx_bottleneck_records_status ON bottleneck_records(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_bottleneck ON corrective_actions(bottleneck_record_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_downtime_records_session ON downtime_records(production_session_id);
CREATE INDEX IF NOT EXISTS idx_downtime_records_start ON downtime_records(downtime_start);
CREATE INDEX IF NOT EXISTS idx_downtime_records_status ON downtime_records(status);
CREATE INDEX IF NOT EXISTS idx_root_causes_downtime ON root_causes(downtime_record_id);

-- Enable RLS
ALTER TABLE bottleneck_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE root_causes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bottleneck_records
DROP POLICY IF EXISTS "read_bottleneck_records" ON bottleneck_records;
CREATE POLICY "read_bottleneck_records" ON bottleneck_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_bottleneck_records" ON bottleneck_records;
CREATE POLICY "write_bottleneck_records" ON bottleneck_records FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for corrective_actions
DROP POLICY IF EXISTS "read_corrective_actions" ON corrective_actions;
CREATE POLICY "read_corrective_actions" ON corrective_actions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_corrective_actions" ON corrective_actions;
CREATE POLICY "write_corrective_actions" ON corrective_actions FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- RLS Policies for downtime_records
DROP POLICY IF EXISTS "read_downtime_records" ON downtime_records;
CREATE POLICY "read_downtime_records" ON downtime_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_downtime_records" ON downtime_records;
CREATE POLICY "write_downtime_records" ON downtime_records FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for root_causes
DROP POLICY IF EXISTS "read_root_causes" ON root_causes;
CREATE POLICY "read_root_causes" ON root_causes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_root_causes" ON root_causes;
CREATE POLICY "write_root_causes" ON root_causes FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_bottleneck_records ON bottleneck_records;
CREATE TRIGGER audit_bottleneck_records
    AFTER INSERT OR UPDATE OR DELETE ON bottleneck_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_downtime_records ON downtime_records;
CREATE TRIGGER audit_downtime_records
    AFTER INSERT OR UPDATE OR DELETE ON downtime_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_corrective_actions ON corrective_actions;
CREATE TRIGGER audit_corrective_actions
    AFTER INSERT OR UPDATE OR DELETE ON corrective_actions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
