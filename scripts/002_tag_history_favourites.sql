-- Tag history and favourites for rank tag generator
-- Run in Supabase SQL Editor after 001_setup_schema.sql
--
-- Safe to re-run: drops existing tables first (history & favourites data will be lost).

DROP TABLE IF EXISTS public.tag_favourites CASCADE;
DROP TABLE IF EXISTS public.tag_history CASCADE;

-- Recent tag configurations (auto-saved on download, max per user enforced in app)
CREATE TABLE public.tag_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  style_id TEXT NOT NULL,
  color_mode TEXT NOT NULL CHECK (color_mode IN ('solid', 'gradient')),
  color TEXT NOT NULL DEFAULT '#fbbf24',
  gradient_start TEXT NOT NULL DEFAULT '#0051FF',
  gradient_end TEXT NOT NULL DEFAULT '#FFFFFF',
  gradient_angle INTEGER NOT NULL DEFAULT 0,
  icon_id TEXT,
  icon_bg_sync BOOLEAN NOT NULL DEFAULT TRUE,
  icon_style_id TEXT NOT NULL DEFAULT 'rounded',
  icon_color_sync BOOLEAN NOT NULL DEFAULT TRUE,
  icon_color_mode TEXT NOT NULL DEFAULT 'solid',
  icon_color TEXT NOT NULL DEFAULT '#fbbf24',
  icon_gradient_start TEXT NOT NULL DEFAULT '#0051FF',
  icon_gradient_end TEXT NOT NULL DEFAULT '#FFFFFF',
  icon_gradient_angle INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tag_history_user_created
  ON public.tag_history (user_id, created_at DESC);

-- User-saved favourite tag configurations
CREATE TABLE public.tag_favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  text TEXT NOT NULL,
  style_id TEXT NOT NULL,
  color_mode TEXT NOT NULL CHECK (color_mode IN ('solid', 'gradient')),
  color TEXT NOT NULL DEFAULT '#fbbf24',
  gradient_start TEXT NOT NULL DEFAULT '#0051FF',
  gradient_end TEXT NOT NULL DEFAULT '#FFFFFF',
  gradient_angle INTEGER NOT NULL DEFAULT 0,
  icon_id TEXT,
  icon_bg_sync BOOLEAN NOT NULL DEFAULT TRUE,
  icon_style_id TEXT NOT NULL DEFAULT 'rounded',
  icon_color_sync BOOLEAN NOT NULL DEFAULT TRUE,
  icon_color_mode TEXT NOT NULL DEFAULT 'solid',
  icon_color TEXT NOT NULL DEFAULT '#fbbf24',
  icon_gradient_start TEXT NOT NULL DEFAULT '#0051FF',
  icon_gradient_end TEXT NOT NULL DEFAULT '#FFFFFF',
  icon_gradient_angle INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tag_favourites_user_created
  ON public.tag_favourites (user_id, created_at DESC);

-- RLS: tag_history
ALTER TABLE public.tag_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tag_history_select_own" ON public.tag_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tag_history_insert_own" ON public.tag_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tag_history_delete_own" ON public.tag_history
  FOR DELETE USING (auth.uid() = user_id);

-- RLS: tag_favourites
ALTER TABLE public.tag_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tag_favourites_select_own" ON public.tag_favourites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tag_favourites_insert_own" ON public.tag_favourites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tag_favourites_update_own" ON public.tag_favourites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tag_favourites_delete_own" ON public.tag_favourites
  FOR DELETE USING (auth.uid() = user_id);
