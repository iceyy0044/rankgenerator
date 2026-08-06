-- Custom folders for organizing favourites + manual drag-and-drop ordering.
-- Run in Supabase SQL Editor after 006_gradient_colors.sql.
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS guards throughout.

CREATE TABLE IF NOT EXISTS public.tag_favourite_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tag_favourite_folders_user
  ON public.tag_favourite_folders (user_id, created_at DESC);

ALTER TABLE public.tag_favourite_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tag_favourite_folders_select_own" ON public.tag_favourite_folders;
CREATE POLICY "tag_favourite_folders_select_own" ON public.tag_favourite_folders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tag_favourite_folders_insert_own" ON public.tag_favourite_folders;
CREATE POLICY "tag_favourite_folders_insert_own" ON public.tag_favourite_folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tag_favourite_folders_update_own" ON public.tag_favourite_folders;
CREATE POLICY "tag_favourite_folders_update_own" ON public.tag_favourite_folders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tag_favourite_folders_delete_own" ON public.tag_favourite_folders;
CREATE POLICY "tag_favourite_folders_delete_own" ON public.tag_favourite_folders
  FOR DELETE USING (auth.uid() = user_id);

-- Favourites can optionally belong to a folder (NULL = unfiled). Deleting a
-- folder unfiles its favourites rather than deleting them.
ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.tag_favourite_folders(id) ON DELETE SET NULL;

-- Manual drag-and-drop order. Fractional positions let a reorder update only
-- the moved row (new position = midpoint of its new neighbours).
ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION;

UPDATE public.tag_favourites
SET position = extract(epoch FROM created_at)
WHERE position IS NULL;

ALTER TABLE public.tag_favourites
  ALTER COLUMN position SET NOT NULL;

ALTER TABLE public.tag_favourites
  ALTER COLUMN position SET DEFAULT extract(epoch FROM clock_timestamp());

CREATE INDEX IF NOT EXISTS idx_tag_favourites_user_folder_position
  ON public.tag_favourites (user_id, folder_id, position DESC);
