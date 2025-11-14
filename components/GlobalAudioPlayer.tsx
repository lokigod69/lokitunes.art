'use client'

import { useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { usePathname } from 'next/navigation'
import { useAudioStore } from '@/lib/audio-store'
import { Play, Pause, Volume2 } from 'lucide-react'
import Image from 'next/image'

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
    setCurrentTime,
    setVolume,
  } = useAudioStore()
  
  // Use album palette colors for themed player
  const accentColor = currentPalette?.accent1 || '#4F9EFF'
  const bgColor = currentPalette?.dominant || '#090B0D'
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const seekFromClientX = (clientX: number) => {
    if (!progressBarRef.current || !duration) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const percent = (clientX - rect.left) / rect.width
    const clamped = Math.max(0, Math.min(1, percent))
    const newTime = clamped * duration
    setCurrentTime(newTime)
  }

  const handleBarClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!duration || isScrubbing) return
    seekFromClientX(e.clientX)
  }

  const handleKnobPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsScrubbing(true)
  }

  const handleKnobPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    seekFromClientX(e.clientX)
  }

  const handleKnobPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsScrubbing(false)
  }
  
  return (
    <>
      {/* Player UI only shows when there's a track */}
      {currentVersion && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-void/95 backdrop-blur-lg border-t z-50"
          style={{ borderColor: `${accentColor}30` }}
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Left: Cover + Info */}
              <div className="flex items-center gap-3 min-w-0">
                {currentVersion.cover_url && (
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-void">
                    <Image
                      src={currentVersion.cover_url}
                      alt={currentVersion.label}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col min-w-[120px]">
                  <p className="text-sm font-medium text-bone truncate">
                    {currentVersion.label}
                  </p>
                  <p className="text-xs text-bone/60">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>
              </div>

              {/* Center: Play/Pause only */}
              <button
                onClick={() =>
                  isPlaying
                    ? pause()
                    : play(currentVersion, currentVersion.song_id)
                }
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-transform hover:scale-105"
                style={{ backgroundColor: accentColor }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-void" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5 text-void ml-0.5" fill="currentColor" />
                )}
              </button>

              {/* Progress bar with knob */}
              <div className="flex-1">
                <div
                  ref={progressBarRef}
                  className="relative h-1.5 bg-bone/10 rounded-full cursor-pointer"
                  onClick={handleBarClick}
                >
                  {/* Filled progress */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: accentColor,
                    }}
                  />

                  {/* Draggable knob */}
                  <div
                    className="absolute w-3 h-3 rounded-full cursor-grab active:cursor-grabbing"
                    style={{
                      left: `${progress}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${accentColor}`,
                    }}
                    onPointerDown={handleKnobPointerDown}
                    onPointerMove={handleKnobPointerMove}
                    onPointerUp={handleKnobPointerUp}
                    onPointerCancel={handleKnobPointerUp}
                  />

                  {/* Hidden range for accessibility */}
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

              {/* Right: Volume */}
              <div className="flex items-center gap-2 flex-shrink-0">
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
          </div>
        </div>
      )}
    </>
  )
}
