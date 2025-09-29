-- Fix potential user ID mismatches between auth.users and public.users
-- This ensures that users can be found by either ID or email

-- Create a function to sync user IDs if there's a mismatch
CREATE OR REPLACE FUNCTION public.sync_user_ids()
RETURNS void AS $$
BEGIN
  -- Update any users in public.users that have mismatched IDs
  -- by finding the correct auth.users ID by email
  UPDATE public.users 
  SET id = auth_users.id
  FROM auth.users AS auth_users
  WHERE public.users.email = auth_users.email 
    AND public.users.id != auth_users.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the sync function
SELECT public.sync_user_ids();

-- Also ensure that any users in auth.users have corresponding entries in public.users
INSERT INTO public.users (id, email, name, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Clean up the sync function
DROP FUNCTION public.sync_user_ids();
