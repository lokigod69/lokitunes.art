'use client'

import { RatingStars } from '@/components/RatingStars'

interface RatingSummaryProps {
  userRating?: number | null
  avgRating?: number
  ratingCount?: number
  accentColor?: string
}

export function RatingSummary({ userRating, accentColor }: RatingSummaryProps) {
  if (!Number.isFinite(userRating) || !userRating || userRating <= 0) return null

  const rounded = Math.max(1, Math.min(10, Math.round(userRating)))

  return (
    <div className="flex items-center gap-3">
      <RatingStars value={rounded} readOnly size={18} color={accentColor} />
      <div className="text-sm">
        <span className="text-bone/60 mr-2">Your rating:</span>
        <span className="text-bone font-medium">{userRating.toFixed(1)}/10</span>
      </div>
    </div>
  )
}
