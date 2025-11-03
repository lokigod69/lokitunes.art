import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on database schema
export interface Album {
  id: string
  slug: string
  title: string
  cover_url: string | null
  palette: {
    dominant: string
    accent1: string
    accent2: string
  } | null
  is_public: boolean
  created_at: string
  total_versions?: number
}

export interface Song {
  id: string
  album_id: string
  title: string
  track_no: number | null
  created_at: string
}

export interface SongVersion {
  id: string
  song_id: string
  label: string
  audio_url: string
  duration_sec: number | null
  waveform_json: string | null
  play_count: number
  created_at: string
}

export interface SongWithVersions extends Song {
  versions: SongVersion[]
}

export interface AlbumWithSongs extends Album {
  songs: SongWithVersions[]
}
