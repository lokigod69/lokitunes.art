'use client'

import { useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { useAudioStore } from '@/lib/audio-store'
import { formatTime } from '@/lib/utils'

export function MiniPlayer() {
  const { currentVersion, isPlaying, currentTime, duration, play, pause } = useAudioStore()
  const miniPlayerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (currentVersion) {
            if (isPlaying) {
              pause()
            } else {
              play(currentVersion, currentVersion.song_id)
            }
          }
          break
        // Additional shortcuts can be added here
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentVersion, isPlaying, play, pause])

  if (!currentVersion) {
    return null
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={miniPlayerRef}
      className="fixed bottom-0 left-0 right-0 h-16 bg-void/95 backdrop-blur-md border-t border-bone/10 z-50"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-bone/10">
        <div
          className="h-full bg-voltage transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="h-full flex items-center gap-4 px-6">
        {/* Play/Pause */}
        <button
          onClick={() => {
            if (isPlaying) {
              pause()
            } else {
              play(currentVersion, currentVersion.song_id)
            }
          }}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-voltage hover:bg-voltage/80 transition-colors flex items-center justify-center"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-void" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 text-void" fill="currentColor" />
          )}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="text-bone text-sm font-medium truncate">
            {currentVersion.label}
          </p>
          <p className="text-bone/50 text-xs">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>

        {/* Simplified waveform visualization */}
        <div className="hidden md:flex items-center gap-0.5 h-8">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.random() * 100
            const isActive = (i / 20) * 100 < progress
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${
                  isActive ? 'bg-voltage' : 'bg-bone/20'
                }`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
