// Admin analytics API endpoint (V1) – exposes rating metrics for the hidden overlay.
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RatingRow = { rating: number | null; ip_hash: string | null }
type StatsRow = { version_id: string; avg_rating: number | null; rating_count: number | null }
type RecentRow = { version_id: string; rating: number | null; comment: string | null; created_at: string }
type VersionRow = { id: string; label: string | null; song_id: string }
type SongRow = { id: string; title: string | null }

type VersionStat = {
  versionId: string
  songTitle: string
  versionLabel: string
  avgRating: number
  ratingCount: number
}

type RecentRating = {
  songTitle: string
  versionLabel: string
  rating: number
  comment: string | null
  createdAt: string
}

export async function GET(_request: NextRequest) {
  try {
    const [ratingsRes, topRatedRes, mostRatedRes, lowestRatedRes, recentRes] = await Promise.all([
      supabase.from('song_version_ratings').select('rating, ip_hash'),
      supabase
        .from('song_version_rating_stats')
        .select('version_id, avg_rating, rating_count')
        .gte('rating_count', 3)
        .order('avg_rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(10),
      supabase
        .from('song_version_rating_stats')
        .select('version_id, avg_rating, rating_count')
        .order('rating_count', { ascending: false })
        .order('avg_rating', { ascending: false })
        .limit(10),
      supabase
        .from('song_version_rating_stats')
        .select('version_id, avg_rating, rating_count')
        .gte('rating_count', 3)
        .order('avg_rating', { ascending: true })
        .order('rating_count', { ascending: false })
        .limit(10),
      supabase
        .from('song_version_ratings')
        .select('version_id, rating, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    if (ratingsRes.error || topRatedRes.error || mostRatedRes.error || lowestRatedRes.error || recentRes.error) {
      console.error('Admin analytics query errors', {
        ratingsError: ratingsRes.error,
        topRatedError: topRatedRes.error,
        mostRatedError: mostRatedRes.error,
        lowestRatedError: lowestRatedRes.error,
        recentError: recentRes.error,
      })
      return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 })
    }

    const ratingRows = (ratingsRes.data || []) as RatingRow[]
    const topRatedStats = (topRatedRes.data || []) as StatsRow[]
    const mostRatedStats = (mostRatedRes.data || []) as StatsRow[]
    const lowestRatedStats = (lowestRatedRes.data || []) as StatsRow[]
    const recentRows = (recentRes.data || []) as RecentRow[]

    let totalRatings = 0
    let sumRatings = 0
    const ipSet = new Set<string>()
    const buckets: number[] = Array(11).fill(0)

    for (const row of ratingRows) {
      if (row.rating != null) {
        totalRatings += 1
        sumRatings += row.rating
        if (row.rating >= 1 && row.rating <= 10) buckets[row.rating] += 1
      }
      if (row.ip_hash) ipSet.add(row.ip_hash)
    }

    const distribution = [] as { rating: number; count: number }[]
    for (let r = 1; r <= 10; r++) {
      distribution.push({ rating: r, count: buckets[r] || 0 })
    }

    const allVersionIds = new Set<string>()
    const addIds = (rows: StatsRow[]) => {
      for (const row of rows) allVersionIds.add(row.version_id)
    }
    addIds(topRatedStats)
    addIds(mostRatedStats)
    addIds(lowestRatedStats)
    for (const r of recentRows) allVersionIds.add(r.version_id)

    const versionIdList = Array.from(allVersionIds)
    let versions: VersionRow[] = []
    let songs: SongRow[] = []

    if (versionIdList.length > 0) {
      const versionsRes = await supabase
        .from('song_versions')
        .select('id, label, song_id')
        .in('id', versionIdList)

      if (!versionsRes.error && versionsRes.data) {
        versions = versionsRes.data as VersionRow[]
        const songIds = Array.from(new Set(versions.map((v) => v.song_id)))
        if (songIds.length > 0) {
          const songsRes = await supabase
            .from('songs')
            .select('id, title')
            .in('id', songIds)

          if (!songsRes.error && songsRes.data) {
            songs = songsRes.data as SongRow[]
          }
        }
      }
    }

    const versionMap = new Map<string, VersionRow>()
    for (const v of versions) versionMap.set(v.id, v)
    const songMap = new Map<string, SongRow>()
    for (const s of songs) songMap.set(s.id, s)

    const buildVersionStats = (rows: StatsRow[]): VersionStat[] => {
      return rows.map((row) => {
        const v = versionMap.get(row.version_id)
        const song = v ? songMap.get(v.song_id) : undefined
        return {
          versionId: row.version_id,
          songTitle: (song && song.title) || 'Unknown Song',
          versionLabel: (v && v.label) || 'Unknown Version',
          avgRating: row.avg_rating != null ? Number(row.avg_rating) : 0,
          ratingCount: row.rating_count != null ? Number(row.rating_count) : 0,
        }
      })
    }

    const topRated = buildVersionStats(topRatedStats)
    const mostRated = buildVersionStats(mostRatedStats)
    const lowestRated = buildVersionStats(lowestRatedStats)

    const recentActivity: RecentRating[] = recentRows.map((row) => {
      const v = versionMap.get(row.version_id)
      const song = v ? songMap.get(v.song_id) : undefined
      return {
        songTitle: (song && song.title) || 'Unknown Song',
        versionLabel: (v && v.label) || 'Unknown Version',
        rating: row.rating != null ? Number(row.rating) : 0,
        comment: row.comment,
        createdAt: row.created_at,
      }
    })

    const avgRating = totalRatings > 0 ? Number((sumRatings / totalRatings).toFixed(2)) : 0

    return NextResponse.json({
      overview: {
        totalRatings,
        uniqueRaters: ipSet.size,
        avgRating,
        distribution,
      },
      topVersions: {
        topRated,
        mostRated,
        lowestRated,
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Admin analytics API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
