"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface RatingStarsProps {
  value: number // 1–10
  onChange?: (stars: number) => void
  readOnly?: boolean
  size?: number
  color?: string
}

export function RatingStars({
  value,
  onChange,
  readOnly = false,
  size = 20,
  color = "#FFA500",
}: RatingStarsProps) {
  const [hover, setHover] = useState(0)

  const activeValue = hover || value

  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }).map((_, index) => {
        const star = index + 1
        const isActive = star <= activeValue

        // Opacity gradient: star 1 ≈ 0.46 → star 10 = 1.0
        const opacity = isActive ? 0.4 + star * 0.06 : 0.3

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => {
              if (!readOnly) onChange?.(star)
            }}
            onMouseEnter={() => {
              if (!readOnly) setHover(star)
            }}
            onMouseLeave={() => {
              if (!readOnly) setHover(0)
            }}
            className={readOnly ? 'cursor-default' : 'cursor-pointer transition-all'}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            <Star
              size={size}
              className={isActive ? 'transition-all' : 'text-gray-600'}
              style={
                isActive
                  ? {
                      fill: color,
                      color,
                      opacity,
                    }
                  : {}
              }
            />
          </button>
        )
      })}
    </div>
  )
}
