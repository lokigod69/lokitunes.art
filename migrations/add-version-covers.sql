-- Migration: Add cover_url to song_versions table
-- Run this in Supabase SQL Editor if you have an existing database

-- Add cover_url column to song_versions
ALTER TABLE public.song_versions ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.song_versions.cover_url IS 'Optional cover art URL specific to this version (e.g., Suno-generated art)';
