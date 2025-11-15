import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getClientIp, hashIp } from '@/lib/ip-hash'

export async function GET(
  request: NextRequest,
  { params }: { params: { versionId: string } }
) {
  try {
    const { versionId } = params

    if (!versionId) {
      return NextResponse.json(
        { error: 'Missing versionId' },
        { status: 400 }
      )
    }

    const ip = getClientIp(request)
    const ipHash = hashIp(ip)

    const { data: stats, error: statsError } = await supabase
      .from('song_version_rating_stats')
      .select('*')
      .eq('version_id', versionId)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Supabase stats error:', statsError)
    }

    let userRating = null
    if (ipHash) {
      const { data, error: userError } = await supabase
        .from('song_version_ratings')
        .select('*')
        .eq('version_id', versionId)
        .eq('ip_hash', ipHash)
        .single()

      if (!userError) {
        userRating = data
      } else if (userError.code !== 'PGRST116') {
        console.error('Supabase userRating error:', userError)
      }
    }

    const { data: comments, error: commentsError } = await supabase
      .from('song_version_ratings')
      .select('id, rating, comment, created_at')
      .eq('version_id', versionId)
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (commentsError && commentsError.code !== 'PGRST116') {
      console.error('Supabase comments error:', commentsError)
    }

    return NextResponse.json({
      versionId,
      stats: stats || null,
      userRating: userRating || null,
      comments: comments || [],
    })
  } catch (error) {
    console.error('API error (GET /api/ratings/[versionId]):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
