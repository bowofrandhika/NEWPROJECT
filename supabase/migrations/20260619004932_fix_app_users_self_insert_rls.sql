-- Fix: allow a user to insert their own app_users row (needed for signup).
-- The previous policy required the caller to already be an ADMIN, which made
-- the very first signup impossible and left appUser null (hiding all nav menus).
DROP POLICY IF EXISTS "admins_insert_users" ON app_users;
DROP POLICY IF EXISTS "users_insert_own_profile" ON app_users;

-- Allow any authenticated user to insert a row where user_id = their own auth.uid()
CREATE POLICY "users_insert_own_profile"
ON app_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can still insert rows for other users (e.g. creating accounts from admin panel)
CREATE POLICY "admins_insert_users"
ON app_users FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM app_users WHERE user_id = auth.uid() AND role IN ('ADMIN', 'SUPER_USER')
    )
);
