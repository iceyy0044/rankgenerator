-- Deprecated: use 002_tag_history_favourites.sql instead (drops and recreates tables).
-- Only use this if you need an in-place migration without losing existing rows.

ALTER TABLE public.tag_history
  DROP COLUMN IF EXISTS icon_enabled,
  DROP COLUMN IF EXISTS icon_url;

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_id TEXT;

ALTER TABLE public.tag_favourites
  DROP COLUMN IF EXISTS icon_enabled,
  DROP COLUMN IF EXISTS icon_url;

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_id TEXT;
