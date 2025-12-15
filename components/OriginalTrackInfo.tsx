'use client'

// Album header ⓘ popover for playing a non-ratable source original track (is_original).

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Info, Play, Pause, X } from 'lucide-react'
import { useAudioStore } from '@/lib/audio-store'
import type { Album } from '@/lib/supabase'
import type { ExtendedVersion } from '@/components/VersionOrb'

interface OriginalTrackInfoProps {
  albumSlug: string
  original: ExtendedVersion
  albumPalette: Album['palette']
}

export function OriginalTrackInfo({ albumSlug, original, albumPalette }: OriginalTrackInfoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const { currentVersion, isPlaying, playStandalone, pause } = useAudioStore()

  const isThisActive = currentVersion?.id === original.id
  const isThisPlaying = isThisActive && isPlaying

  const accentColor = albumPalette?.accent1 || '#4F9EFF'

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const key = `lokitunes-original-dismissed-${albumSlug}`
      const dismissed = window.localStorage?.getItem(key) === 'true'
      setIsDismissed(dismissed)
    } catch {
      // ignore storage errors
    }
  }, [albumSlug])

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: PointerEvent) => {
      const el = containerRef.current
      if (!el) return
      if (el.contains(e.target as Node)) return
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsOpen(false)
    if (typeof window === 'undefined') return
    try {
      const key = `lokitunes-original-dismissed-${albumSlug}`
      window.localStorage?.setItem(key, 'true')
    } catch {
      // ignore storage errors
    }
  }

  const handlePlayPause = () => {
    if (isThisPlaying) {
      pause()
      return
    }

    playStandalone(original, original.song_id, albumPalette || undefined)
  }

  if (isDismissed) return null

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="text-bone/50 hover:text-bone/80 transition-colors"
        aria-label="Original demo info"
        title="Original demo"
      >
        <Info className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[260px] rounded-lg border border-white/10 bg-void/95 backdrop-blur-lg shadow-xl p-3 z-20"
          style={{ boxShadow: `0 12px 40px ${accentColor}22` }}
        >
          <div className="flex items-start gap-3">
            {original.cover_url ? (
              <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-void border border-white/10">
                <Image
                  src={original.cover_url}
                  alt={original.label}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10">
                <span className="text-bone/30 text-xs">♪</span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-xs text-bone/50">Original Demo</div>
              <div className="text-sm text-bone truncate">{original.label}</div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-bone/40 hover:text-bone/70 transition-colors"
              aria-label="Dismiss original demo"
              title="Hide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePlayPause}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 hover:border-[var(--voltage)] transition-colors text-xs"
              style={{ borderColor: `${accentColor}66` }}
            >
              {isThisPlaying ? (
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4" fill="currentColor" />
              )}
              <span>{isThisPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <div className="text-[10px] text-bone/40">Not ratable</div>
          </div>
        </div>
      )}
    </div>
  )
}
