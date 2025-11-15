import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getClientIp, hashIp } from '@/lib/ip-hash'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { versionId, songId, ratingStars, comment } = body || {}

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

    const ip = getClientIp(request)
    const ipHash = hashIp(ip)

    if (!ipHash) {
      return NextResponse.json(
        { error: 'Could not determine client IP' },
        { status: 400 }
      )
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : ''
    const finalComment = trimmedComment && trimmedComment.length > 0
      ? trimmedComment.slice(0, 200)
      : null

    const { data, error } = await supabase
      .from('song_version_ratings')
      .upsert({
        version_id: versionId,
        song_id: songId,
        rating: ratingStars, // 1-10 directly
        comment: finalComment,
        ip_hash: ipHash,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'version_id,ip_hash',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase upsert error (ratings):', error)
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      )
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
