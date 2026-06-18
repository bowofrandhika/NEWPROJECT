/*
# Module D - Packing & Pallet Tracking Schema

This migration implements Module D for packing and pallet tracking activities.

## Changes Overview
1. Creates pallet_tracking for pallet management with QR code support
2. Creates packing_records for detailed packing records
3. Creates pallet_qr_codes for QR code generation and tracking

## New Tables
- `pallet_tracking`: Main pallet tracking with QR support
- `packing_records`: Individual packing records
- `pallet_qr_codes`: QR code generation and tracking

## Foreign Keys
- All tables reference production_sessions as parent
- Pallet QR references pallet_tracking

## Security
- RLS enabled with operator-level access
*/

-- Pallet Tracking table
CREATE TABLE IF NOT EXISTS pallet_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    pallet_code varchar(30) NOT NULL UNIQUE,
    qr_code varchar(100) UNIQUE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    batch varchar(50),
    packing_date date NOT NULL,
    packed_qty integer NOT NULL DEFAULT 0 CHECK (packed_qty >= 0),
    gross_weight numeric(10,2) CHECK (gross_weight >= 0),
    net_weight numeric(10,2) CHECK (net_weight >= 0),
    tare_weight numeric(10,2) DEFAULT 0 CHECK (tare_weight >= 0),
    number_of_bags integer DEFAULT 0 CHECK (number_of_bags >= 0),
    status varchar(20) DEFAULT 'PACKED' CHECK (status IN ('PACKED', 'STAGED', 'SHIPPED', 'ON_HOLD', 'RELEASED')),
    location varchar(50),
    inspector_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    packed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at timestamptz,
    shipment_id varchar(50),
    shipped_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Packing Records table (individual packing entries)
CREATE TABLE IF NOT EXISTS packing_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pallet_tracking_id uuid NOT NULL REFERENCES pallet_tracking(id) ON DELETE CASCADE,
    production_session_id uuid NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
    bag_number integer NOT NULL DEFAULT 0 CHECK (bag_number >= 0),
    gross_weight numeric(10,2) CHECK (gross_weight >= 0),
    net_weight numeric(10,2) CHECK (net_weight >= 0),
    grade varchar(20),
    packed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    packed_at timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Pallet QR Codes table (for QR tracking)
CREATE TABLE IF NOT EXISTS pallet_qr_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pallet_tracking_id uuid NOT NULL REFERENCES pallet_tracking(id) ON DELETE CASCADE,
    qr_code varchar(100) NOT NULL UNIQUE,
    qr_data text NOT NULL,
    generated_at timestamptz DEFAULT now(),
    scanned_at timestamptz,
    scanned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    scan_location varchar(50),
    scan_purpose varchar(50),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pallet_tracking_session ON pallet_tracking(production_session_id);
CREATE INDEX IF NOT EXISTS idx_pallet_tracking_code ON pallet_tracking(pallet_code);
CREATE INDEX IF NOT EXISTS idx_pallet_tracking_status ON pallet_tracking(status);
CREATE INDEX IF NOT EXISTS idx_packing_records_pallet ON packing_records(pallet_tracking_id);
CREATE INDEX IF NOT EXISTS idx_packing_records_session ON packing_records(production_session_id);
CREATE INDEX IF NOT EXISTS idx_pallet_qr_code ON pallet_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_pallet_qr_pallet ON pallet_qr_codes(pallet_tracking_id);

-- Enable RLS
ALTER TABLE pallet_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pallet_tracking
DROP POLICY IF EXISTS "read_pallet_tracking" ON pallet_tracking;
CREATE POLICY "read_pallet_tracking" ON pallet_tracking FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_pallet_tracking" ON pallet_tracking;
CREATE POLICY "write_pallet_tracking" ON pallet_tracking FOR ALL
TO authenticated
USING (has_role('PACKING_OPERATOR'::user_role))
WITH CHECK (has_role('PACKING_OPERATOR'::user_role));

-- RLS Policies for packing_records
DROP POLICY IF EXISTS "read_packing_records" ON packing_records;
CREATE POLICY "read_packing_records" ON packing_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_packing_records" ON packing_records;
CREATE POLICY "write_packing_records" ON packing_records FOR ALL
TO authenticated
USING (has_role('PACKING_OPERATOR'::user_role))
WITH CHECK (has_role('PACKING_OPERATOR'::user_role));

-- RLS Policies for pallet_qr_codes
DROP POLICY IF EXISTS "read_pallet_qr_codes" ON pallet_qr_codes;
CREATE POLICY "read_pallet_qr_codes" ON pallet_qr_codes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_pallet_qr_codes" ON pallet_qr_codes;
CREATE POLICY "write_pallet_qr_codes" ON pallet_qr_codes FOR ALL
TO authenticated
USING (has_role('PACKING_OPERATOR'::user_role))
WITH CHECK (has_role('PACKING_OPERATOR'::user_role));

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_pallet_tracking ON pallet_tracking;
CREATE TRIGGER audit_pallet_tracking
    AFTER INSERT OR UPDATE OR DELETE ON pallet_tracking
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_packing_records ON packing_records;
CREATE TRIGGER audit_packing_records
    AFTER INSERT OR UPDATE OR DELETE ON packing_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
