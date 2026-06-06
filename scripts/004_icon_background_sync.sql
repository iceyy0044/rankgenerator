-- Add icon background sync columns (if 002 was already applied without them)

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_bg_sync BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_style_id TEXT NOT NULL DEFAULT 'rounded';

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_bg_sync BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_style_id TEXT NOT NULL DEFAULT 'rounded';
