-- Function to look up auth email by app_users.username.
-- SECURITY DEFINER so it bypasses RLS on app_users (otherwise a freshly
-- logged-in user couldn't be looked up before their own profile row existed).
CREATE OR REPLACE FUNCTION get_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM app_users WHERE username = p_username LIMIT 1;
$$;

-- Allow any authenticated user to call it
GRANT EXECUTE ON FUNCTION get_email_by_username(text) TO authenticated;
