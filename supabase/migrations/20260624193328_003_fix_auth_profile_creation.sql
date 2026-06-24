-- Fix profiles RLS INSERT policy to allow trigger creation
-- The trigger will run as SECURITY DEFINER so it bypasses RLS, but we still need a proper policy

-- First, create the missing profiles for existing users who don't have one
INSERT INTO profiles (id, user_id, email, first_name, last_name, role, status)
SELECT 
  u.id,
  u.id::text,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', 'Unknown'),
  COALESCE(u.raw_user_meta_data->>'last_name', 'User'),
  'student',
  'pending'
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Drop the old insert policy
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- Create a new insert policy that allows authenticated users to insert their own profile
-- OR allows the trigger (which runs as security definer)
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Create a function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, first_name, last_name, role, status)
  VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'pending'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();