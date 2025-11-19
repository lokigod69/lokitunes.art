'use client'

// Hook to fetch admin analytics data for the keyboard-triggered overlay.
import { useCallback, useState } from 'react'

export type VersionStat = {
  versionId: string
  songTitle: string
  versionLabel: string
  avgRating: number
  ratingCount: number
}

export type RecentRating = {
  songTitle: string
  versionLabel: string
  rating: number
  comment: string | null
  createdAt: string
}

export type RatingDistributionBucket = {
  rating: number
  count: number
}

export type AdminAnalyticsOverview = {
  totalRatings: number
  uniqueRaters: number
  avgRating: number
  distribution: RatingDistributionBucket[]
}

export type AdminAnalyticsTopVersions = {
  topRated: VersionStat[]
  mostRated: VersionStat[]
  lowestRated: VersionStat[]
}

export type AdminAnalyticsResponse = {
  overview: AdminAnalyticsOverview
  topVersions: AdminAnalyticsTopVersions
  recentActivity: RecentRating[]
}

export function useAdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) {
        throw new Error('Failed to load analytics.')
      }
      const json = (await res.json()) as AdminAnalyticsResponse
      setData(json)
    } catch (err: any) {
      console.error('Failed to fetch admin analytics', err)
      setError(err?.message || 'Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, refetch }
}
