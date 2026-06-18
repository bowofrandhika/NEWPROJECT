/*
# Work Orders and Production Sessions Schema

This migration establishes the work order and daily instruction system that serves as the parent for all production activities.

## Changes Overview
1. Creates work_orders table for MES-level work order management
2. Creates production_sessions (Daily Instruction) as the core production planning entity
3. Adds production_schedule for scheduling
4. Establishes relationships with shift, line, batch, and buyer tracking

## New Tables
- `work_orders`: Master work orders linking batches, shifts, and lines
- `production_sessions`: Daily instructions with target production data
- `buyers`: Master buyer/customer data
- `products`: Master product data
- `lines`: Production line master data
- `shifts`: Shift configuration

## Foreign Keys
- work_orders references buyers, products
- production_sessions references work_orders, lines, shifts

## Security
- RLS enabled on all tables
- Role-based access for CRUD operations
*/

-- Buyers table
CREATE TABLE IF NOT EXISTS buyers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_code varchar(20) NOT NULL UNIQUE,
    buyer_name varchar(100) NOT NULL,
    address text,
    contact_person varchar(100),
    contact_phone varchar(20),
    email varchar(100),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code varchar(20) NOT NULL UNIQUE,
    product_name varchar(100) NOT NULL,
    description text,
    unit varchar(20) NOT NULL DEFAULT 'KG',
    buyer_id uuid REFERENCES buyers(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Production Lines table
CREATE TABLE IF NOT EXISTS lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    line_code varchar(20) NOT NULL UNIQUE,
    line_name varchar(50) NOT NULL,
    line_type varchar(50),
    capacity integer DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_code varchar(10) NOT NULL UNIQUE,
    shift_name varchar(20) NOT NULL,
    shift_type shift_type NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Work Orders table (NEW - MES level)
CREATE TABLE IF NOT EXISTS work_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wo_number varchar(30) NOT NULL UNIQUE,
    wo_date date NOT NULL,
    buyer_id uuid REFERENCES buyers(id) ON DELETE SET NULL,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    batch_code varchar(50) NOT NULL,
    target_qty integer NOT NULL CHECK (target_qty >= 0),
    completed_qty integer NOT NULL DEFAULT 0 CHECK (completed_qty >= 0),
    status production_status NOT NULL DEFAULT 'DRAFT',
    priority integer DEFAULT 5,
    notes text,
    planned_start_date date,
    planned_end_date date,
    actual_start_date date,
    actual_end_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Production Sessions table (Daily Instruction)
CREATE TABLE IF NOT EXISTS production_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number varchar(30) NOT NULL UNIQUE,
    work_order_id uuid REFERENCES work_orders(id) ON DELETE SET NULL,
    session_date date NOT NULL,
    shift_id uuid REFERENCES shifts(id) ON DELETE SET NULL,
    line_id uuid REFERENCES lines(id) ON DELETE SET NULL,
    buyer_id uuid REFERENCES buyers(id) ON DELETE SET NULL,
    batch varchar(50),
    target_production integer NOT NULL DEFAULT 0 CHECK (target_production >= 0),
    actual_production integer NOT NULL DEFAULT 0 CHECK (actual_production >= 0),
    status production_status NOT NULL DEFAULT 'DRAFT',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Production Schedule table (NEW - links work orders to sessions)
CREATE TABLE IF NOT EXISTS production_schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    production_session_id uuid REFERENCES production_sessions(id) ON DELETE SET NULL,
    scheduled_date date NOT NULL,
    shift_id uuid REFERENCES shifts(id) ON DELETE SET NULL,
    line_id uuid REFERENCES lines(id) ON DELETE SET NULL,
    scheduled_qty integer NOT NULL CHECK (scheduled_qty >= 0),
    status production_status NOT NULL DEFAULT 'DRAFT',
    notes text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_wo_number ON work_orders(wo_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_wo_date ON work_orders(wo_date);
CREATE INDEX IF NOT EXISTS idx_production_sessions_date ON production_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_production_sessions_status ON production_sessions(status);
CREATE INDEX IF NOT EXISTS idx_production_sessions_shift ON production_sessions(shift_id);
CREATE INDEX IF NOT EXISTS idx_production_schedule_wo ON production_schedule(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_schedule_date ON production_schedule(scheduled_date);

-- Enable RLS
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for master tables (admin/supervisor can manage)
-- Buyers
DROP POLICY IF EXISTS "read_buyers" ON buyers;
CREATE POLICY "read_buyers" ON buyers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_buyers" ON buyers;
CREATE POLICY "write_buyers" ON buyers FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

-- Products
DROP POLICY IF EXISTS "read_products" ON products;
CREATE POLICY "read_products" ON products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_products" ON products;
CREATE POLICY "write_products" ON products FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

-- Lines
DROP POLICY IF EXISTS "read_lines" ON lines;
CREATE POLICY "read_lines" ON lines FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_lines" ON lines;
CREATE POLICY "write_lines" ON lines FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

-- Shifts
DROP POLICY IF EXISTS "read_shifts" ON shifts;
CREATE POLICY "read_shifts" ON shifts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_shifts" ON shifts;
CREATE POLICY "write_shifts" ON shifts FOR ALL
TO authenticated
USING (has_role('ADMIN'::user_role))
WITH CHECK (has_role('ADMIN'::user_role));

-- Work Orders
DROP POLICY IF EXISTS "read_work_orders" ON work_orders;
CREATE POLICY "read_work_orders" ON work_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_work_orders" ON work_orders;
CREATE POLICY "write_work_orders" ON work_orders FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

-- Production Sessions (all authenticated can read, SPV+ can write)
DROP POLICY IF EXISTS "read_production_sessions" ON production_sessions;
CREATE POLICY "read_production_sessions" ON production_sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_production_sessions" ON production_sessions;
CREATE POLICY "write_production_sessions" ON production_sessions FOR ALL
TO authenticated
USING (has_role('MANDOR'::user_role))
WITH CHECK (has_role('MANDOR'::user_role));

-- Production Schedule
DROP POLICY IF EXISTS "read_production_schedule" ON production_schedule;
CREATE POLICY "read_production_schedule" ON production_schedule FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_production_schedule" ON production_schedule;
CREATE POLICY "write_production_schedule" ON production_schedule FOR ALL
TO authenticated
USING (has_role('SPV'::user_role))
WITH CHECK (has_role('SPV'::user_role));

-- Add triggers for audit
DROP TRIGGER IF EXISTS audit_work_orders ON work_orders;
CREATE TRIGGER audit_work_orders
    AFTER INSERT OR UPDATE OR DELETE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_production_sessions ON production_sessions;
CREATE TRIGGER audit_production_sessions
    AFTER INSERT OR UPDATE OR DELETE ON production_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
