import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getClientIp, hashIp } from '@/lib/ip-hash'

export async function GET(request: NextRequest) {
  try {
    const { count: totalVersionsCount, error: totalVersionsError } = await supabase
      .from('song_versions')
      .select('id', { count: 'exact', head: true })
      .eq('is_original', false)

    if (totalVersionsError) {
      console.error('Supabase rating progress total count error:', totalVersionsError)
    }

    const totalVersions = typeof totalVersionsCount === 'number' ? totalVersionsCount : 0

    let ratedByUser = 0

    const ip = getClientIp(request)
    const ipHash = hashIp(ip)

    if (ipHash) {
      const { count, error } = await supabase
        .from('song_version_ratings')
        .select('version_id, song_versions!inner(is_original)', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .eq('song_versions.is_original', false)

      if (error) {
        console.error('Supabase rating progress user count error:', error)
      } else if (typeof count === 'number') {
        ratedByUser = count
      }
    }

    const percentage = totalVersions > 0
      ? Math.round((ratedByUser / totalVersions) * 100)
      : 0

    return NextResponse.json({
      totalVersions,
      ratedByUser,
      percentage,
    })
  } catch (error) {
    console.error('API error (GET /api/user/rating-progress):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
