-- Add multi-stop gradient color columns (if tables exist without them)

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS gradient_colors TEXT NOT NULL DEFAULT '["#0051FF","#FFFFFF"]';

ALTER TABLE public.tag_history
  ADD COLUMN IF NOT EXISTS icon_gradient_colors TEXT NOT NULL DEFAULT '["#0051FF","#FFFFFF"]';

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS gradient_colors TEXT NOT NULL DEFAULT '["#0051FF","#FFFFFF"]';

ALTER TABLE public.tag_favourites
  ADD COLUMN IF NOT EXISTS icon_gradient_colors TEXT NOT NULL DEFAULT '["#0051FF","#FFFFFF"]';

-- Backfill from legacy start/end columns where JSON column is empty or default-only
UPDATE public.tag_history
SET gradient_colors = json_build_array(gradient_start, gradient_end)::text
WHERE gradient_colors IS NULL OR gradient_colors = '["#0051FF","#FFFFFF"]';

UPDATE public.tag_history
SET icon_gradient_colors = json_build_array(icon_gradient_start, icon_gradient_end)::text
WHERE icon_gradient_colors IS NULL OR icon_gradient_colors = '["#0051FF","#FFFFFF"]';

UPDATE public.tag_favourites
SET gradient_colors = json_build_array(gradient_start, gradient_end)::text
WHERE gradient_colors IS NULL OR gradient_colors = '["#0051FF","#FFFFFF"]';

UPDATE public.tag_favourites
SET icon_gradient_colors = json_build_array(icon_gradient_start, icon_gradient_end)::text
WHERE icon_gradient_colors IS NULL OR icon_gradient_colors = '["#0051FF","#FFFFFF"]';
