import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getClientIp, hashIp } from '@/lib/ip-hash'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { versionId, songId, ratingStars, comment, tags } = body || {}

    if (!versionId || !songId) {
      return NextResponse.json(
        { error: 'Missing versionId or songId' },
        { status: 400 }
      )
    }

    if (!ratingStars || ratingStars < 1 || ratingStars > 10) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      )
    }

    const { data: versionRow, error: versionError } = await supabase
      .from('song_versions')
      .select('id, song_id, is_original')
      .eq('id', versionId)
      .single()

    if (versionError || !versionRow) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    if (versionRow.song_id !== songId) {
      return NextResponse.json(
        { error: 'Version does not belong to this song' },
        { status: 400 }
      )
    }

    if (versionRow.is_original) {
      return NextResponse.json(
        { error: 'Original tracks cannot be rated' },
        { status: 403 }
      )
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Get IP hash for anonymous users
    const ip = getClientIp(request)
    const ipHash = hashIp(ip)

    // Must have either user_id or ip_hash
    if (!userId && !ipHash) {
      return NextResponse.json(
        { error: 'Could not determine client identity' },
        { status: 400 }
      )
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : ''
    const finalComment = trimmedComment && trimmedComment.length > 0
      ? trimmedComment.slice(0, 200)
      : null

    // Build rating data based on auth status
    // Logged in: use user_id, Anonymous: use ip_hash
    const ratingData = {
      version_id: versionId,
      song_id: songId,
      rating: ratingStars,
      comment: finalComment,
      updated_at: new Date().toISOString(),
      ...(userId
        ? { user_id: userId, ip_hash: null }
        : { ip_hash: ipHash, user_id: null }
      )
    }

    // Upsert based on auth status
    // Logged in: conflict on (version_id, user_id)
    // Anonymous: conflict on (version_id, ip_hash)
    const { data, error } = await supabase
      .from('song_version_ratings')
      .upsert(ratingData, {
        onConflict: userId ? 'version_id,user_id' : 'version_id,ip_hash',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Supabase upsert error (ratings):', error)
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      )
    }

    // Optional: save tags for this rating
    if (tags && data.id) {
      const likes: string[] = Array.isArray(tags.likes) ? tags.likes : []
      const dislikes: string[] = Array.isArray(tags.dislikes) ? tags.dislikes : []

      // Clear existing tags for this rating
      const { error: deleteError } = await supabase
        .from('rating_tags')
        .delete()
        .eq('rating_id', data.id)

      if (deleteError) {
        console.error('Supabase delete error (rating_tags):', deleteError)
      }

      const rows = [
        ...likes.map((tag) => ({
          rating_id: data.id,
          tag_type: 'like' as const,
          tag_value: tag,
        })),
        ...dislikes.map((tag) => ({
          rating_id: data.id,
          tag_type: 'dislike' as const,
          tag_value: tag,
        })),
      ]

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from('rating_tags')
          .insert(rows)

        if (insertError) {
          console.error('Supabase insert error (rating_tags):', insertError)
        }
      }
    }

    const { data: stats } = await supabase
      .from('song_version_rating_stats')
      .select('*')
      .eq('version_id', versionId)
      .single()

    return NextResponse.json({
      success: true,
      rating: data,
      stats: stats || null,
    })
  } catch (error) {
    console.error('API error (POST /api/ratings):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
