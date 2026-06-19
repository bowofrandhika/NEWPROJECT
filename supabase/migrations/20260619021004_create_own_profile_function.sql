-- Function called by the client right after auth.signUp to create the
-- app_users profile row. Bypasses RLS via SECURITY DEFINER because the
-- freshly-signed-up user may not yet have a usable session and
-- users_insert_own_profile requires auth.uid() to match.
CREATE OR REPLACE FUNCTION create_own_profile(
  p_user_id uuid,
  p_username text,
  p_full_name text,
  p_email text,
  p_role user_role DEFAULT 'DRYER_OPERATOR'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO app_users (user_id, username, full_name, email, role)
  VALUES (p_user_id, p_username, p_full_name, p_email, p_role)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_own_profile(uuid, text, text, text, user_role) TO authenticated;
