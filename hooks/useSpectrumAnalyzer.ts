// React hook that streams frequency bin data from the global audio analyzer on each animation frame.

'use client'

import { useEffect, useRef } from 'react'
import { getAudioElement } from '@/lib/audio-element-registry'
import { ensureConnected, getFrequencyData, resumeContextIfNeeded } from '@/lib/audio-analyzer'

export function useSpectrumAnalyzer(
  isPlaying: boolean,
  onFrame?: (data: Uint8Array) => void,
  /** Skip Web Audio connection on mobile to prevent iOS background audio issues */
  isMobile: boolean = false
) {
  const rafRef = useRef<number | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    // 🍎 CRITICAL: Skip Web Audio entirely on mobile
    // createMediaElementSource() routes ALL audio through Web Audio API
    // iOS suspends AudioContext when screen locks, causing silence
    if (isMobile) {
      return
    }

    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    resumeContextIfNeeded().catch(() => {})

    let cancelled = false

    const tick = () => {
      if (cancelled) return

      try {
        const audioEl = getAudioElement()
        if (audioEl) {
          ensureConnected(audioEl)
          const filled = getFrequencyData(dataRef.current ?? undefined)
          if (filled) {
            dataRef.current = filled
            onFrame?.(filled)
          }
        }
      } catch {
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlaying, onFrame, isMobile])

  return dataRef
}
