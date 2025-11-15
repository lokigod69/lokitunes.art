'use client'

import { RatingStars } from '@/components/RatingStars'

interface RatingSummaryProps {
  avgRating: number
  ratingCount: number
  accentColor?: string
}

export function RatingSummary({ avgRating, ratingCount, accentColor }: RatingSummaryProps) {
  if (!Number.isFinite(avgRating) || ratingCount <= 0) return null

  const rounded = Math.max(1, Math.min(10, Math.round(avgRating)))

  return (
    <div className="flex items-center gap-3">
      <RatingStars value={rounded} readOnly size={18} color={accentColor} />
      <div className="text-sm">
        <span className="text-bone font-medium">{avgRating.toFixed(1)}/10</span>
        <span className="text-bone/60 ml-2">
          ({ratingCount} rating{ratingCount === 1 ? '' : 's'})
        </span>
      </div>
    </div>
  )
}
