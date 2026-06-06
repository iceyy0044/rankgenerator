-- Add icon color sync columns (if 002/004 was already applied without them)

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_color_sync BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_color_mode TEXT NOT NULL DEFAULT 'solid';

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_color TEXT NOT NULL DEFAULT '#fbbf24';

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_gradient_start TEXT NOT NULL DEFAULT '#0051FF';

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_gradient_end TEXT NOT NULL DEFAULT '#FFFFFF';

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_gradient_angle INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_color_sync BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_color_mode TEXT NOT NULL DEFAULT 'solid';

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_color TEXT NOT NULL DEFAULT '#fbbf24';

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_gradient_start TEXT NOT NULL DEFAULT '#0051FF';

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_gradient_end TEXT NOT NULL DEFAULT '#FFFFFF';

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_gradient_angle INTEGER NOT NULL DEFAULT 0;
