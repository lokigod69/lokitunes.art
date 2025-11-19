'use client'

// Lists top-rated, most-rated, and lowest-rated versions for admin analytics overlay.
import type { AdminAnalyticsTopVersions, VersionStat } from '@/hooks/useAdminAnalytics'

interface AdminTopVersionsListProps {
  topVersions: AdminAnalyticsTopVersions | null
  loading: boolean
}

const medals = ['🥇', '🥈', '🥉']

function renderList(label: string, items: VersionStat[]) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-bone/60">
        {label}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-bone/50">No ratings in this category yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((item, index) => {
            const medal = index < medals.length ? medals[index] : null
            return (
              <li
                key={item.versionId}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {medal ? (
                    <span className="text-base" aria-hidden="true">
                      {medal}
                    </span>
                  ) : (
                    <span className="w-4 text-right text-[10px] text-bone/40">
                      {index + 1}.
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-bone/90">
                      {item.songTitle}{' '}
                      <span className="text-bone/60">- {item.versionLabel}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap text-xs text-bone/60">
                  <span className="text-bone">★ {item.avgRating.toFixed(1)}</span>
                  <span className="text-bone/50">
                    ({item.ratingCount} {item.ratingCount === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function AdminTopVersionsList({ topVersions, loading }: AdminTopVersionsListProps) {
  if (loading && !topVersions) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-bone/60">Loading version stats...</p>
      </section>
    )
  }

  if (!topVersions) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-bone/60">No version stats available yet.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-bone/20 bg-black/40 px-4 py-3">
          {renderList('Top rated', topVersions.topRated)}
        </div>
        <div className="rounded-lg border border-bone/20 bg-black/40 px-4 py-3">
          {renderList('Most rated', topVersions.mostRated)}
        </div>
        <div className="rounded-lg border border-bone/20 bg-black/40 px-4 py-3">
          {renderList('Lowest rated', topVersions.lowestRated)}
        </div>
      </div>
    </section>
  )
}
