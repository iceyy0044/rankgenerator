-- Persistent custom icon storage (drawn in the pixel-art icon editor) + a
-- public library flag for both custom icons and saved favourites, so
-- licensed users can share their icons/tags with each other.
-- Run in Supabase SQL Editor after 007_favourite_folders_and_order.sql.
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS guards throughout.

CREATE TABLE IF NOT EXISTS public.custom_icons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Icon',
  image_data TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_icons_user
  ON public.custom_icons (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_icons_public
  ON public.custom_icons (created_at DESC) WHERE is_public = TRUE;

ALTER TABLE public.custom_icons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_icons_select_own_or_public" ON public.custom_icons;
CREATE POLICY "custom_icons_select_own_or_public" ON public.custom_icons
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

DROP POLICY IF EXISTS "custom_icons_insert_own" ON public.custom_icons;
CREATE POLICY "custom_icons_insert_own" ON public.custom_icons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "custom_icons_update_own" ON public.custom_icons;
CREATE POLICY "custom_icons_update_own" ON public.custom_icons
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "custom_icons_delete_own" ON public.custom_icons;
CREATE POLICY "custom_icons_delete_own" ON public.custom_icons
  FOR DELETE USING (auth.uid() = user_id);

-- Public library flag: a favourite the owner has chosen to share with other
-- licensed users (browsable in the "Community" tab).
ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tag_favourites_public
  ON public.tag_favourites (created_at DESC) WHERE is_public = TRUE;

-- Widen the existing "own rows only" SELECT policy to also allow reading
-- public rows regardless of owner (needed for community browsing).
DROP POLICY IF EXISTS "tag_favourites_select_own" ON public.tag_favourites;
CREATE POLICY "tag_favourites_select_own_or_public" ON public.tag_favourites
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
