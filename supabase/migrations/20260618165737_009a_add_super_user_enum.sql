-- Add SUPER_USER to user_role enum (must be in its own migration)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_USER';
