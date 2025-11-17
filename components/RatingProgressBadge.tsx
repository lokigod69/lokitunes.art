"use client"

import { useEffect, useState } from 'react'
import { getRatingProgressColor } from '@/lib/colorUtils'

interface RatingProgressData {
  totalVersions: number
  ratedByUser: number
  percentage: number
}

export function RatingProgressBadge() {
  const [data, setData] = useState<RatingProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setIsLoading(true)
      setHasError(false)

      try {
        const res = await fetch('/api/user/rating-progress')
        if (!res.ok) throw new Error('Failed to load rating progress')
        const json = await res.json()
        if (isCancelled) return
        setData(json)
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch rating progress:', error)
          setHasError(true)
          setData(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  if (isLoading || hasError || !data || data.totalVersions === 0) {
    return null
  }

  const { totalVersions, ratedByUser, percentage } = data
  const color = getRatingProgressColor(percentage)

  return (
    <div
      className="px-3 py-1 rounded-full text-xs font-mono tracking-wide bg-black/40 border border-bone/20 shadow-[0_0_15px_rgba(0,0,0,0.6)]"
      style={{ color, backdropFilter: 'blur(6px)' }}
    >
      <span className="text-[10px] uppercase text-bone/50 mr-2">Rating progress</span>
      <span className="text-bone/80">
        <span style={{ color }}>{ratedByUser}</span>
        <span className="mx-1 text-bone/40">/</span>
        <span>{totalVersions}</span>
        <span className="ml-1 text-bone/50">rated</span>
      </span>
    </div>
  )
}
