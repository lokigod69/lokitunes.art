'use client'

// Global root component that wires keyboard shortcuts to the admin analytics overlay.
import { useEffect, useState } from 'react'
import { AdminAnalyticsOverlay } from '@/components/admin/AdminAnalyticsOverlay'
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics'

export function AdminAnalyticsRoot() {
  const [showAnalytics, setShowAnalytics] = useState(false)
  const { data, loading, error, refetch } = useAdminAnalytics()

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        setShowAnalytics((prev) => !prev)
      } else if (e.key === 'Escape' && showAnalytics) {
        setShowAnalytics(false)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [showAnalytics])

  useEffect(() => {
    if (showAnalytics) {
      refetch()
    }
  }, [showAnalytics, refetch])

  if (!showAnalytics) {
    return null
  }

  return (
    <AdminAnalyticsOverlay
      overview={data?.overview ?? null}
      topVersions={data?.topVersions ?? null}
      recentActivity={data?.recentActivity ?? []}
      loading={loading}
      error={error}
      onClose={() => setShowAnalytics(false)}
    />
  )
}
