'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAudioStore } from '@/lib/audio-store'
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react'
import Image from 'next/image'
import { useWaveformPeaks } from '@/hooks/useWaveformPeaks'

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function GlobalAudioPlayer() {
  const pathname = usePathname()
  
  // Hide on home page - MiniPlayer handles audio UI there
  if (pathname === '/') {
    return null
  }
  
  const { 
    currentVersion, 
    currentPalette,
    isPlaying, 
    currentTime,
    duration,
    volume,
    play, 
    pause, 
    next, 
    previous,
    setCurrentTime,
    setDuration,
    setVolume,
    updateTime,
  } = useAudioStore()
  
  // Use album palette colors for themed player
  const accentColor = currentPalette?.accent1 || '#4F9EFF'
  const bgColor = currentPalette?.dominant || '#090B0D'
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  
  // Half-pipe SVG path animation state (Phase 2)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    if (pathRef.current && pathLength === 0) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [pathLength])

  const dashOffset = pathLength > 0 ? pathLength * (1 - progress / 100) : 0
  
  // Extract real waveform peaks from audio
  const { peaks } = useWaveformPeaks(currentVersion?.audio_url || '', 50)
  
  return (
    <>
      {/* Player UI only shows when there's a track */}
      {currentVersion && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-void/95 backdrop-blur-lg border-t z-50"
          style={{ borderColor: `${accentColor}30` }}
        >
      
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {/* Compact left-aligned layout: cover, title, controls, volume all grouped on the left */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-4">
            {/* Cover */}
            {currentVersion.cover_url && (
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded overflow-hidden flex-shrink-0 bg-void">
                <Image
                  src={currentVersion.cover_url}
                  alt={currentVersion.label}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Track info */}
            <div className="flex flex-col min-w-0">
              <p className="text-xs sm:text-sm font-medium text-bone truncate">{currentVersion.label}</p>
              <p className="text-xs text-bone/50 truncate">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={previous} 
                className="p-2 hover:bg-voltage/20 rounded-full transition-colors cursor-pointer"
                aria-label="Previous"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-bone" />
              </button>
              
              <button 
                onClick={() => isPlaying ? pause() : play(currentVersion, currentVersion.song_id)}
                className="p-2 sm:p-3 rounded-full transition-all hover:scale-105 cursor-pointer"
                style={{ backgroundColor: accentColor }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-void" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-void ml-0.5" fill="currentColor" />
                )}
              </button>
              
              <button 
                onClick={next} 
                className="p-2 hover:bg-voltage/20 rounded-full transition-colors cursor-pointer"
                aria-label="Next"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-bone" />
              </button>
            </div>

            {/* Volume - Desktop only, right next to controls */}
            <div className="hidden md:flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-bone/70" />
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 accent-voltage cursor-pointer 
                           [&::-webkit-slider-thumb]:appearance-none 
                           [&::-webkit-slider-thumb]:w-3.5 
                           [&::-webkit-slider-thumb]:h-3.5 
                           [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-voltage
                           [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>

          {/* Right side spacer to keep group compact on the left */}
          <div className="flex-1" />
        </div>
        
        {/* Progress Bar with Waveform Visualization */}
        <div className="mt-2 space-y-1.5">
          {/* Waveform bars - Real audio peaks */}
          <div className="flex items-center gap-0.5 h-6">
            {(peaks.length > 0 ? peaks : Array(50).fill(0.5)).map((peak, i) => {
              const height = Math.abs(peak) * 100
              const isActive = (i / (peaks.length || 50)) * 100 < progress
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-150"
                  style={{ 
                    height: `${Math.max(height, 20)}%`,
                    backgroundColor: isActive ? accentColor : `${accentColor}30`,
                    opacity: isActive ? 1 : 0.5
                  }}
                />
              )
            })}
          </div>
          
          {/* Progress bar */}
          <div
            className="relative w-full h-10 cursor-pointer group"
            onClick={(e) => {
              if (!duration) return
              const rect = e.currentTarget.getBoundingClientRect()
              const clickX = e.clientX - rect.left
              const percent = clickX / rect.width
              const clamped = Math.max(0, Math.min(1, percent))
              const newTime = clamped * duration
              setCurrentTime(newTime)
            }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                ref={pathRef}
                d="M 0 0 L 20 0 Q 40 100 66 100 Q 80 100 80 0 L 100 0"
                fill="none"
                stroke={accentColor}
                strokeWidth={2}
                strokeOpacity={0.6}
                strokeDasharray={pathLength || undefined}
                strokeDashoffset={pathLength ? dashOffset : undefined}
                style={{ transition: 'stroke-dashoffset 120ms linear' }}
              />
            </svg>

            <div className="absolute left-0 right-0 bottom-2 h-1.5 bg-bone/10 rounded-full">
              <div 
                className="absolute h-full rounded-full transition-all"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: accentColor
                }}
              />
            </div>
            
            {/* Seek input */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                const time = parseFloat(e.target.value)
                setCurrentTime(time)
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
        </div>
      )}
    </>
  )
}
