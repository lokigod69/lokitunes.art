-- Loki Tunes Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Albums table: each album is a reality unto itself
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  cover_url text,
  palette jsonb,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- Songs table: compositions within an album
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.albums on delete cascade,
  title text not null,
  track_no int,
  created_at timestamptz default now()
);

-- Song versions table: evolution paths of each song
create table public.song_versions (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references public.songs on delete cascade,
  label text not null,
  audio_url text not null,
  duration_sec int,
  waveform_json text,
  play_count int default 0,
  created_at timestamptz default now()
);

-- Create indexes for better query performance
create index idx_songs_album_id on public.songs(album_id);
create index idx_song_versions_song_id on public.song_versions(song_id);
create index idx_albums_slug on public.albums(slug);
create index idx_albums_is_public on public.albums(is_public);

-- Enable Row Level Security
alter table public.albums enable row level security;
alter table public.songs enable row level security;
alter table public.song_versions enable row level security;

-- RLS Policies: Public read access for public albums
create policy "Public albums are viewable by everyone"
  on public.albums for select
  using (is_public = true);

create policy "Songs are viewable if album is public"
  on public.songs for select
  using (
    exists (
      select 1 from public.albums
      where albums.id = songs.album_id
      and albums.is_public = true
    )
  );

create policy "Song versions are viewable if album is public"
  on public.song_versions for select
  using (
    exists (
      select 1 from public.songs
      join public.albums on albums.id = songs.album_id
      where songs.id = song_versions.song_id
      and albums.is_public = true
    )
  );

-- Function to increment play count
create or replace function increment_play_count(version_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.song_versions
  set play_count = play_count + 1
  where id = version_id;
end;
$$;

-- Storage buckets setup (run these commands in Supabase Dashboard > Storage)
-- 1. Create bucket: 'audio' (public)
-- 2. Create bucket: 'covers' (public)

-- Sample data for testing (optional)
-- Uncomment to insert test data

/*
insert into public.albums (slug, title, cover_url, palette, is_public) values
  ('first-thoughts', 'First Thoughts', 'covers/first-thoughts.jpg', 
   '{"dominant": "#2A1B3D", "accent1": "#4F9EFF", "accent2": "#FF6B4A"}'::jsonb, true);

insert into public.songs (album_id, title, track_no) values
  ((select id from public.albums where slug = 'first-thoughts'), 'Opening', 1),
  ((select id from public.albums where slug = 'first-thoughts'), 'Reflection', 2);

insert into public.song_versions (song_id, label, audio_url, duration_sec) values
  ((select id from public.songs where title = 'Opening'), 'Original', 'audio/opening-original.wav', 180),
  ((select id from public.songs where title = 'Opening'), 'Remix 1', 'audio/opening-remix1.wav', 195),
  ((select id from public.songs where title = 'Reflection'), 'Original', 'audio/reflection-original.wav', 240);
*/
