-- Discord snowflake ID for each user (distinct from discord_username, which is just
-- a display name and can change). Needed to reliably match a developer invite.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_id TEXT;

-- A license owner may grant developer access to exactly one other Discord account,
-- identified by that account's Discord user ID. Being a single nullable column (not
-- a table) naturally caps this at one per owner.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS developer_discord_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_developer_discord_id
  ON public.profiles (developer_discord_id)
  WHERE developer_discord_id IS NOT NULL;

-- Populate discord_id for new signups going forward (existing profiles are backfilled
-- on next login, see app/dashboard/layout.tsx).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, discord_username, avatar_url, discord_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'provider_id', NEW.raw_user_meta_data ->> 'sub', NULL),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
