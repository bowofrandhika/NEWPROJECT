/*
# Module C - Dryer Monitoring Schema

This migration implements Module C for dryer monitoring activities.

## Changes Overview
1. Creates dryer_monitoring as parent for dryer monitoring sessions
2. Creates dryer_monitoring_records for individual monitoring entries
3. Creates reject_records for reject tracking

## New Tables
- `dryer_monitoring`: Main dryer monitoring record per session
- `dryer_monitoring_records`: Detailed temperature and humidity readings
- `reject_records`: Reject tracking and classification
- `dryers`: Master dryer equipment data

## Foreign Keys
- All tables reference production_sessions as parent
- Dryer equipment references

## Security
- RLS enabled with operator-level access
*/

-- Dryers master table
CREATE TABLE IF NOT EXISTS dryers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dryer_code varchar(20) NOT NULL UNIQUE,
    dryer_name varchar(50) NOT NULL,
    line_id uuid REFERENCES lines(id) ON DELETE SET NULL,
    capacity numeric(10,2),
    min_temp numeric(5,2),
    max_temp numeric(5,2),
    min_humidity numeric(5,2),
    max_humidity numeric(5,2),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Trolleys master table
CREATE TABLE IF NOT EXISTS trolleys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trolley_code varchar(20) NOT NULL UNIQUE,
    trolley_name varchar(50) NOT NULL,
    capacity integer DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Dryer Monitoring table
CREATE TABLE IF NOT EXISTS dryer_monitoring (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    dryer_id uuid REFERENCES dryers(id) ON DELETE SET NULL,
    monitoring_date date NOT NULL,
    start_time timestamptz,
    end_time timestamptz,
    cycle_number integer DEFAULT 1,
    status varchar(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    monitored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Dryer Monitoring Records table (detailed readings)
CREATE TABLE IF NOT EXISTS dryer_monitoring_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dryer_monitoring_id uuid NOT NULL REFERENCES dryer_monitoring(id) ON DELETE CASCADE,
    record_time timestamptz NOT NULL DEFAULT now(),
    inlet_temp numeric(5,2),
    outlet_temp numeric(5,2),
    product_temp numeric(5,2),
    humidity numeric(5,2),
    airflow numeric(8,2),
    belt_speed numeric(5,2),
    load_percentage numeric(5,2),
    recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Trolley Monitoring table
CREATE TABLE IF NOT EXISTS trolley_monitoring (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    trolley_id uuid REFERENCES trolleys(id) ON DELETE SET NULL,
    load_time timestamptz,
    unload_time timestamptz,
    loaded_qty integer NOT NULL DEFAULT 0 CHECK (loaded_qty >= 0),
    unloaded_qty integer NOT NULL DEFAULT 0 CHECK (unloaded_qty >= 0),
    dryer_id uuid REFERENCES dryers(id) ON DELETE SET NULL,
    cycle_number integer DEFAULT 1,
    status varchar(20) DEFAULT 'LOADED' CHECK (status IN ('EMPTY', 'LOADED', 'IN_DRYER', 'UNLOADED')),
    monitored_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Reject Records table
CREATE TABLE IF NOT EXISTS reject_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    reject_time timestamptz NOT NULL DEFAULT now(),
    reject_type varchar(50) NOT NULL,
    reject_category varchar(50),
    reject_qty integer NOT NULL DEFAULT 0 CHECK (reject_qty >= 0),
    reject_reason text,
    dryer_id uuid REFERENCES dryers(id) ON DELETE SET NULL,
    trolley_id uuid REFERENCES trolleys(id) ON DELETE SET NULL,
    process_step varchar(50),
    disposition varchar(30) CHECK (disposition IN ('SCRAP', 'REWORK', 'HOLD', 'RETURN')),
    recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status varchar(20) DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'VERIFIED', 'DISPOSED')),
    created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dryers_line ON dryers(line_id);
CREATE INDEX IF NOT EXISTS idx_dryer_monitoring_session ON dryer_monitoring(production_session_id);
CREATE INDEX IF NOT EXISTS idx_dryer_monitoring_records_parent ON dryer_monitoring_records(dryer_monitoring_id);
CREATE INDEX IF NOT EXISTS idx_trolley_monitoring_session ON trolley_monitoring(production_session_id);
CREATE INDEX IF NOT EXISTS idx_reject_records_session ON reject_records(production_session_id);
CREATE INDEX IF NOT EXISTS idx_reject_records_time ON reject_records(reject_time);

-- Enable RLS
ALTER TABLE dryers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trolleys ENABLE ROW LEVEL SECURITY;
ALTER TABLE dryer_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE dryer_monitoring_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE trolley_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE reject_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for master tables
DROP POLICY IF EXISTS "read_dryers" ON dryers;
CREATE POLICY "read_dryers" ON dryers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_dryers" ON dryers;
CREATE POLICY "write_dryers" ON dryers FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

DROP POLICY IF EXISTS "read_trolleys" ON trolleys;
CREATE POLICY "read_trolleys" ON trolleys FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_trolleys" ON trolleys;
CREATE POLICY "write_trolleys" ON trolleys FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

-- RLS Policies for dryer_monitoring
DROP POLICY IF EXISTS "read_dryer_monitoring" ON dryer_monitoring;
CREATE POLICY "read_dryer_monitoring" ON dryer_monitoring FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_dryer_monitoring" ON dryer_monitoring;
CREATE POLICY "write_dryer_monitoring" ON dryer_monitoring FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for dryer_monitoring_records
DROP POLICY IF EXISTS "read_dryer_monitoring_records" ON dryer_monitoring_records;
CREATE POLICY "read_dryer_monitoring_records" ON dryer_monitoring_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_dryer_monitoring_records" ON dryer_monitoring_records;
CREATE POLICY "write_dryer_monitoring_records" ON dryer_monitoring_records FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for trolley_monitoring
DROP POLICY IF EXISTS "read_trolley_monitoring" ON trolley_monitoring;
CREATE POLICY "read_trolley_monitoring" ON trolley_monitoring FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_trolley_monitoring" ON trolley_monitoring;
CREATE POLICY "write_trolley_monitoring" ON trolley_monitoring FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- RLS Policies for reject_records
DROP POLICY IF EXISTS "read_reject_records" ON reject_records;
CREATE POLICY "read_reject_records" ON reject_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_reject_records" ON reject_records;
CREATE POLICY "write_reject_records" ON reject_records FOR ALL
TO authenticated
USING (has_role('DRYER_OPERATOR'::user_role))
WITH CHECK (has_role('DRYER_OPERATOR'::user_role));

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_dryer_monitoring ON dryer_monitoring;
CREATE TRIGGER audit_dryer_monitoring
    AFTER INSERT OR UPDATE OR DELETE ON dryer_monitoring
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_reject_records ON reject_records;
CREATE TRIGGER audit_reject_records
    AFTER INSERT OR UPDATE OR DELETE ON reject_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
