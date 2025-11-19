'use client'

// Full-screen admin analytics overlay triggered via keyboard shortcut.
import { X } from 'lucide-react'
import type {
  AdminAnalyticsOverview,
  AdminAnalyticsTopVersions,
  RecentRating,
} from '@/hooks/useAdminAnalytics'
import { AdminOverviewStats } from '@/components/admin/AdminOverviewStats'
import { AdminTopVersionsList } from '@/components/admin/AdminTopVersionsList'
import { AdminRecentActivityFeed } from '@/components/admin/AdminRecentActivityFeed'

interface AdminAnalyticsOverlayProps {
  overview: AdminAnalyticsOverview | null
  topVersions: AdminAnalyticsTopVersions | null
  recentActivity: RecentRating[]
  loading: boolean
  error: string | null
  onClose: () => void
}

export function AdminAnalyticsOverlay({
  overview,
  topVersions,
  recentActivity,
  loading,
  error,
  onClose,
}: AdminAnalyticsOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-bone/25 bg-gradient-to-b from-black/80 via-void/95 to-black/90 shadow-2xl sm:mx-6 lg:mx-0"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-bone/20 bg-black/60 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-bone/90">
              LOKITUNES ANALYTICS
            </h2>
            <p className="mt-1 text-[11px] text-bone/60">
              Ctrl+Shift+A to toggle · ESC to close
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-bone/30 bg-black/40 p-1.5 text-bone/70 hover:bg-bone/10 hover:text-bone cursor-pointer"
            aria-label="Close analytics"
          >
            <X size={16} />
          </button>
        </header>

        {loading && (
          <div className="flex items-center gap-3 border-b border-bone/10 bg-black/40 px-4 py-3 text-sm text-bone/70 sm:px-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-bone/40 border-t-voltage" />
            <span>Loading analytics...</span>
          </div>
        )}

        <div className="space-y-8 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {!loading && (
            <>
              <AdminOverviewStats overview={overview} loading={loading} />

              <AdminTopVersionsList topVersions={topVersions} loading={loading} />

              <AdminRecentActivityFeed recent={recentActivity} loading={loading} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
