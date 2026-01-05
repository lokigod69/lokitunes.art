import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getClientIp, hashIp } from '@/lib/ip-hash'

interface RatingTagRow {
  tag_type: 'like' | 'dislike'
  tag_value: string
}

interface UserRatingRow {
  id: string
  version_id: string
  song_id: string
  rating: number
  comment: string | null
  ip_hash: string
  created_at: string
  rating_tags?: RatingTagRow[]
}

interface UserRatingWithTags extends Omit<UserRatingRow, 'rating_tags'> {
  tags: {
    likes: string[]
    dislikes: string[]
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await params

    if (!versionId) {
      return NextResponse.json(
        { error: 'Missing versionId' },
        { status: 400 }
      )
    }

    const ip = getClientIp(request)
    const ipHash = hashIp(ip)

    let userRating: UserRatingWithTags | null = null
    if (ipHash) {
      const { data, error: userError } = await supabase
        .from('song_version_ratings')
        .select('*, rating_tags (tag_type, tag_value)')
        .eq('version_id', versionId)
        .eq('ip_hash', ipHash)
        .single()

      if (!userError && data) {
        const row = data as UserRatingRow
        const rawTags: RatingTagRow[] = row.rating_tags ?? []
        const likes = rawTags
          .filter((t) => t.tag_type === 'like')
          .map((t) => t.tag_value)
        const dislikes = rawTags
          .filter((t) => t.tag_type === 'dislike')
          .map((t) => t.tag_value)

        const { rating_tags, ...rest } = row
        userRating = {
          ...rest,
          tags: {
            likes,
            dislikes,
          },
        }
      } else if (userError && userError.code !== 'PGRST116') {
        console.error('Supabase userRating error:', userError)
      }
    }

    return NextResponse.json({
      userRating: userRating || null,
    })
  } catch (error) {
    console.error('API error (GET /api/ratings/[versionId]):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
