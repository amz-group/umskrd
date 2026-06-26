-- Migration: Fix profile RLS policies and ensure robust profile creation

-- First, ensure ALL existing auth users have profiles
-- Use metadata or defaults for any missing fields
INSERT INTO profiles (id, user_id, email, first_name, last_name, role, status)
SELECT 
  u.id,
  u.id::text,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', 'Unknown'),
  COALESCE(u.raw_user_meta_data->>'last_name', 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'student'),
  'pending'
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Drop all existing profile policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "delete_profile" ON profiles;

-- Create simpler, more permissive RLS policies for authenticated users
-- SELECT: Users can read their own profile (auth.uid() matches id)
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- INSERT: Allow users to insert their own profile (for edge cases where trigger misses)
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- DELETE: Only super_admin can delete profiles (via admin functions)
-- For safety, we don't allow direct deletion via RLS
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Create a helper function to get or create a profile
-- This can be called from the client to ensure profile exists
CREATE OR REPLACE FUNCTION public.ensure_profile_exists()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  -- Check if profile exists
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();
  
  IF FOUND THEN
    RETURN NEXT v_profile;
    RETURN;
  END IF;
  
  -- Create profile from auth metadata if missing
  INSERT INTO profiles (id, user_id, email, first_name, last_name, role, status)
  SELECT 
    u.id,
    u.id::text,
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', 'Unknown'),
    COALESCE(u.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(u.raw_user_meta_data->>'role', 'student'),
    'pending'
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (id) DO NOTHING
  RETURNING * INTO v_profile;
  
  -- If still no profile (edge case), create with defaults
  IF NOT FOUND THEN
    INSERT INTO profiles (id, user_id, email, first_name, last_name, role, status)
    VALUES (
      auth.uid(),
      auth.uid()::text,
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'Unknown',
      'User',
      'student',
      'pending'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING * INTO v_profile;
  END IF;
  
  RETURN NEXT v_profile;
END;
$$;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert profile with all available metadata
  INSERT INTO public.profiles (id, user_id, email, first_name, last_name, phone, gender, role, status)
  VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    NULLIF(NEW.raw_user_meta_data->>'gender', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.ensure_profile_exists() TO authenticated;