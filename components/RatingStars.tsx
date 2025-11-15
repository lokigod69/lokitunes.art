"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface RatingStarsProps {
  value: number // 1-10
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: number
}

export function RatingStars({ value, onChange, readOnly, size }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const handleClick = (next: number) => {
    if (readOnly) return
    onChange?.(next)
  }

  const handleMouseEnter = (next: number) => {
    if (readOnly) return
    setHoverValue(next)
  }

  const handleMouseLeave = () => {
    if (readOnly) return
    setHoverValue(null)
  }

  const currentValue = hoverValue ?? value
  const starSize = size ?? 20

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, index) => {
        const starValue = index + 1
        const filled = starValue <= currentValue

        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-voltage/80 rounded-sm disabled:cursor-default"
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
          >
            <Star
              size={starSize}
              className={`transition-colors ${
                filled ? "text-amber-400" : "text-bone/40"
              }`}
              fill={filled ? "currentColor" : "none"}
            />
          </button>
        )
      })}
    </div>
  )
}
