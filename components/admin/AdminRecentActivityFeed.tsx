'use client'

// Recent rating activity feed for admin analytics overlay.
import type { RecentRating } from '@/hooks/useAdminAnalytics'

interface AdminRecentActivityFeedProps {
  recent: RecentRating[]
  loading: boolean
}

function formatTimeAgo(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}

export function AdminRecentActivityFeed({ recent, loading }: AdminRecentActivityFeedProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-bone/60">
        Recent activity
      </h3>
      {loading && recent.length === 0 && (
        <p className="text-sm text-bone/60">Loading recent ratings...</p>
      )}
      {!loading && recent.length === 0 && (
        <p className="text-sm text-bone/60">No recent activity.</p>
      )}
      {recent.length > 0 && (
        <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {recent.map((item, idx) => (
            <li
              key={`${item.songTitle}-${item.versionLabel}-${item.createdAt}-${idx}`}
              className="rounded-lg border border-bone/15 bg-black/40 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-bone/90">
                    {item.songTitle}{' '}
                    <span className="text-bone/60">- {item.versionLabel}</span>
                  </p>
                  {item.comment ? (
                    <p className="mt-1 text-xs italic text-bone/70">"{item.comment}"</p>
                  ) : (
                    <p className="mt-1 text-xs text-bone/50">(no comment)</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                  <span className="text-xs font-semibold text-bone">★ {item.rating}</span>
                  <span className="text-[11px] text-bone/50">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
