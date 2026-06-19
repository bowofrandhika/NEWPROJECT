-- Allow anon role to call create_own_profile (during signup there may be no session yet)
-- The function itself validates via a unique constraint on user_id/username.
GRANT EXECUTE ON FUNCTION create_own_profile(uuid, text, text, text, user_role) TO anon;
