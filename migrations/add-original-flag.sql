-- Migration: Add is_original to song_versions table
-- Run this in Supabase SQL Editor if you have an existing database

ALTER TABLE public.song_versions
  ADD COLUMN IF NOT EXISTS is_original BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_song_versions_is_original
  ON public.song_versions(is_original);

COMMENT ON COLUMN public.song_versions.is_original IS 'Marks the source/demo original track (not a ratable version mix).';
