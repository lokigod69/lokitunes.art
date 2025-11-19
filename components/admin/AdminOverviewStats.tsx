'use client'

// Overview cards + simple distribution bars for admin analytics overlay.
import type { AdminAnalyticsOverview } from '@/hooks/useAdminAnalytics'

interface AdminOverviewStatsProps {
  overview: AdminAnalyticsOverview | null
  loading: boolean
}

export function AdminOverviewStats({ overview, loading }: AdminOverviewStatsProps) {
  if (loading && !overview) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-bone/60">Loading overview...</p>
      </section>
    )
  }

  if (!overview) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-bone/60">
          No ratings yet. Come back after listeners have submitted some feedback.
        </p>
      </section>
    )
  }

  if (overview.totalRatings === 0) {
    return (
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-bone/60">
          No ratings yet
        </h3>
        <p className="text-sm text-bone/60">
          Ratings will appear here once users start rating versions.
        </p>
      </section>
    )
  }

  const { totalRatings, uniqueRaters, avgRating, distribution } = overview
  const maxCount = distribution.reduce((max, bucket) => (bucket.count > max ? bucket.count : max), 0) || 1

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-bone/20 bg-black/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-bone/60">Ratings</p>
          <p className="mt-1 text-2xl font-semibold text-bone">{totalRatings}</p>
        </div>
        <div className="rounded-lg border border-bone/20 bg-black/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-bone/60">Average</p>
          <p className="mt-1 text-2xl font-semibold text-bone">{avgRating.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-bone/20 bg-black/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-bone/60">Users</p>
          <p className="mt-1 text-2xl font-semibold text-bone">{uniqueRaters}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-bone/60">Distribution</p>
        </div>
        <div className="flex h-24 items-end gap-1 rounded-md border border-bone/15 bg-black/40 px-3 py-2">
          {distribution.map((bucket) => {
            const height = (bucket.count / maxCount) * 100
            return (
              <div
                key={bucket.rating}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full rounded-sm bg-voltage/80"
                  style={{ height: `${height || 4}%` }}
                />
                <span className="text-[10px] text-bone/50">{bucket.rating}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
