import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getClientIp, hashIp } from '@/lib/ip-hash'
import { getAlbumsWithVersionCounts } from '@/lib/queries'

export async function GET(request: NextRequest) {
  try {
    const albums = await getAlbumsWithVersionCounts()
    const totalVersions = albums.reduce((sum, album) => {
      return sum + (album.total_versions || 0)
    }, 0)

    let ratedByUser = 0

    const ip = getClientIp(request)
    const ipHash = hashIp(ip)

    if (ipHash) {
      const { count, error } = await supabase
        .from('song_version_ratings')
        .select('version_id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)

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
