/**
 * API endpoint to fetch all song versions for global shuffle functionality.
 * Returns a flattened list of all versions across all albums.
 *
 * Uses the shared Supabase client from lib/supabase so build-time env
 * handling stays consistent with the rest of the app.
 */
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Fetch all versions with their song and album context
    const { data: versions, error } = await supabase
      .from('song_versions')
      .select(`
        *,
        songs!inner (
          id,
          title,
          track_no,
          albums!inner (
            id,
            title,
            slug,
            palette
          )
        )
      `)
      .not('audio_url', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    // Flatten the data structure for easier consumption
    const flattenedVersions = (versions || [])
      .filter((v: any) => !v.is_original)
      .map((v: any) => ({
      ...v,
      songId: v.songs.id,
      songTitle: v.songs.title,
      trackNo: v.songs.track_no,
      albumId: v.songs.albums.id,
      albumTitle: v.songs.albums.title,
      albumSlug: v.songs.albums.slug,
      albumPalette: v.songs.albums.palette,
      songs: undefined, // Remove nested structure
    }))

    return NextResponse.json({ versions: flattenedVersions })
  } catch (error) {
    console.error('Error in versions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
