-- License keys table (created first, no forward refs)
CREATE TABLE IF NOT EXISTS public.license_keys (
  key TEXT PRIMARY KEY,
  created_by UUID,
  used_by UUID,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_username TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  license_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign keys after both tables exist
ALTER TABLE public.license_keys
  ADD CONSTRAINT IF NOT EXISTS fk_license_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_license_used_by FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS fk_profile_license_key FOREIGN KEY (license_key) REFERENCES public.license_keys(key) ON DELETE SET NULL;

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS for license_keys
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "license_keys_select_all" ON public.license_keys;
DROP POLICY IF EXISTS "license_keys_admin_insert" ON public.license_keys;
DROP POLICY IF EXISTS "license_keys_admin_update" ON public.license_keys;
DROP POLICY IF EXISTS "license_keys_user_update" ON public.license_keys;

CREATE POLICY "license_keys_select_all" ON public.license_keys
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "license_keys_admin_insert" ON public.license_keys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "license_keys_admin_update" ON public.license_keys
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "license_keys_user_update" ON public.license_keys
  FOR UPDATE USING (
    used_by IS NULL AND is_active = TRUE
  );

-- Service role bypass policies (needed for triggers)
CREATE POLICY "profiles_service_insert" ON public.profiles
  FOR INSERT WITH CHECK (TRUE);

-- Trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, discord_username, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
