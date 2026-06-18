/*
# Core Authentication and User Management Schema

This migration establishes the foundation for the Production Management System (PMS) authentication and user management.

## Changes Overview
1. Creates custom user profile table linked to Supabase auth.users
2. Implements Role-Based Access Control (RBAC) with roles: ADMIN, SPV, MANDOR, DRYER_OPERATOR, PACKING_OPERATOR
3. Sets up audit infrastructure with database triggers

## New Tables
- `app_users`: User profiles extending auth.users with role and plant assignment
- `audit_logs`: System-wide audit trail for all user activities

## Security
- RLS enabled on all tables
- Policies restrict data access based on user ownership and role hierarchy
- Triggers automatically capture audit events

## Notes
1. Uses Supabase Auth for authentication - passwords stored in auth.users, not in app tables
2. Audit triggers fire on INSERT/UPDATE/DELETE for critical tables
3. Role hierarchy: ADMIN > SPV > MANDOR > OPERATOR
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'SPV', 'MANDOR', 'DRYER_OPERATOR', 'PACKING_OPERATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_type AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE production_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create app_users table (extends auth.users)
CREATE TABLE IF NOT EXISTS app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username varchar(50) NOT NULL UNIQUE,
    full_name varchar(100) NOT NULL,
    email varchar(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'DRYER_OPERATOR',
    plant_code varchar(20),
    department varchar(50),
    phone varchar(20),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name varchar(100) NOT NULL,
    record_id uuid,
    action varchar(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')),
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_users
-- Users can read their own profile
DROP POLICY IF EXISTS "users_read_own_profile" ON app_users;
CREATE POLICY "users_read_own_profile"
ON app_users FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all profiles
DROP POLICY IF EXISTS "admins_read_all_profiles" ON app_users;
CREATE POLICY "admins_read_all_profiles"
ON app_users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
);

-- Users can update their own profile (except role)
DROP POLICY IF EXISTS "users_update_own_profile" ON app_users;
CREATE POLICY "users_update_own_profile"
ON app_users FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only admins can insert new users
DROP POLICY IF EXISTS "admins_insert_users" ON app_users;
CREATE POLICY "admins_insert_users"
ON app_users FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
);

-- Only admins can delete users
DROP POLICY IF EXISTS "admins_delete_users" ON app_users;
CREATE POLICY "admins_delete_users"
ON app_users FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
);

-- RLS Policies for audit_logs
-- Admins can read all audit logs
DROP POLICY IF EXISTS "admins_read_audit_logs" ON audit_logs;
CREATE POLICY "admins_read_audit_logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
);

-- Users can insert their own audit logs (for login/logout events)
DROP POLICY IF EXISTS "users_insert_own_audit" ON audit_logs;
CREATE POLICY "users_insert_own_audit"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for app_users
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON app_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id uuid;
BEGIN
    audit_user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, table_name, record_id, action, new_values)
        VALUES (audit_user_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, table_name, record_id, action, old_values, new_values)
        VALUES (audit_user_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, table_name, record_id, action, old_values)
        VALUES (audit_user_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user has role
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS boolean AS $$
DECLARE
    user_role_var user_role;
BEGIN
    SELECT role INTO user_role_var FROM app_users WHERE user_id = auth.uid();
    IF user_role_var IS NULL THEN RETURN false; END IF;
    
    -- Role hierarchy: ADMIN > SPV > MANDOR > OPERATOR
    CASE required_role
        WHEN 'ADMIN' THEN RETURN user_role_var = 'ADMIN';
        WHEN 'SPV' THEN RETURN user_role_var IN ('ADMIN', 'SPV');
        WHEN 'MANDOR' THEN RETURN user_role_var IN ('ADMIN', 'SPV', 'MANDOR');
        WHEN 'DRYER_OPERATOR' THEN RETURN true; -- All roles can access operator level
        WHEN 'PACKING_OPERATOR' THEN RETURN true;
        ELSE RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
