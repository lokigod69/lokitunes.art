/**
 * API endpoint for fetching authenticated user's ratings
 */
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user's ratings with version and album details
    const { data, error } = await supabase
      .from('song_version_ratings')
      .select(`
        id,
        version_id,
        rating,
        comment,
        updated_at,
        song_versions (
          label,
          cover_url,
          songs (
            title,
            albums (
              title,
              slug
            )
          )
        )
      `)
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching user ratings:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform the nested data into a flat structure
    const ratings = (data || []).map((r: any) => ({
      id: r.id,
      version_id: r.version_id,
      rating: r.rating,
      comment: r.comment,
      updated_at: r.updated_at,
      version_label: r.song_versions?.label || 'Unknown',
      cover_url: r.song_versions?.cover_url,
      song_title: r.song_versions?.songs?.title || 'Unknown',
      album_title: r.song_versions?.songs?.albums?.title || 'Unknown',
      album_slug: r.song_versions?.songs?.albums?.slug || '',
    }))

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error('API error (GET /api/user/ratings):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
