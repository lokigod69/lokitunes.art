'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { usePathname } from 'next/navigation'
import { useAudioStore } from '@/lib/audio-store'
import { Play, Pause, Star, Volume2, Download, SkipBack, SkipForward } from 'lucide-react'
import Image from 'next/image'
import { RatingModal } from '@/components/RatingModal'

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface RatingStats {
  avg_rating: number
  rating_count: number
}

interface UserRating {
  rating: number
  comment: string | null
}

export function GlobalAudioPlayer() {
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
    autoplayMode,
    setAutoplayMode,
    next,
    previous,
    queue,
  } = useAudioStore()
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent || ''
      setIsIOS(/iPhone|iPad|iPod/.test(ua))
    }
  }, [])

  // Use album palette colors for themed player
  const accentColor = currentPalette?.accent1 || '#4F9EFF'
  const bgColor = currentPalette?.dominant || '#090B0D'
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [isRatingOpen, setIsRatingOpen] = useState(false)
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null)
  const [userRating, setUserRating] = useState<UserRating | null>(null)
  const [isRatingLoading, setIsRatingLoading] = useState(false)
  const [ratingRefreshToken, setRatingRefreshToken] = useState(0)
  const versionId = currentVersion?.id

  useEffect(() => {
    if (!versionId) {
      setRatingStats(null)
      setUserRating(null)
      setIsRatingLoading(false)
      return
    }

    let isCancelled = false

    const load = async () => {
      setIsRatingLoading(true)
      try {
        const res = await fetch(`/api/ratings/${versionId}`)
        if (!res.ok) throw new Error('Failed to load ratings')
        const data = await res.json()
        if (isCancelled) return
        setRatingStats(data.stats || null)
        setUserRating(data.userRating || null)
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load ratings for player:', error)
          setRatingStats(null)
          setUserRating(null)
        }
      } finally {
        if (!isCancelled) {
          setIsRatingLoading(false)
        }
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [versionId, ratingRefreshToken])

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
 
  const handleDownload = () => {
    if (!currentVersion?.audio_url) return

    try {
      const extended = currentVersion as unknown as { songTitle?: string }
      const songTitle = extended.songTitle
      const rawName = `${songTitle ?? 'lokitunes'}-${currentVersion.label}`
      const baseName = rawName
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-]+/g, '')

      const link = document.createElement('a')
      link.href = currentVersion.audio_url
      link.download = `${baseName || 'track'}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to trigger download:', error)
    }
  }

  const hasRatingStats = !isRatingLoading && !!(ratingStats && ratingStats.rating_count > 0)
  const hasUserRating = !isRatingLoading && !!userRating

  const renderAutoplayToggle = () => {
    if (!currentVersion) return null
    const modes: { mode: 'off' | 'album' | 'all'; label: string }[] = [
      { mode: 'off', label: 'Off' },
      { mode: 'album', label: 'Album' },
      { mode: 'all', label: 'All' },
    ]
    return (
      <div className="flex items-center gap-1 text-[10px] text-bone/60">
        <span className="uppercase tracking-wide">Autoplay</span>
        {modes.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setAutoplayMode(mode)}
            className={
              'px-1.5 py-0.5 rounded-full border cursor-pointer transition-colors ' +
              (autoplayMode === mode
                ? 'border-[var(--voltage)] text-[var(--voltage)] bg-[var(--voltage)]/10'
                : 'border-bone/30 text-bone/50 hover:text-bone hover:border-bone/60')
            }
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Player UI only shows when there's a track */}
      {currentVersion && (
        <div
          className="player fixed bottom-0 left-0 right-0 bg-void/95 backdrop-blur-lg border-t z-50"
          style={{
            borderTopColor: `${accentColor}30`,
            background: `linear-gradient(to top, ${accentColor}18 0%, ${accentColor}08 50%, transparent 100%)`,
          }}
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-3">
            {/* Mobile layout */}
            <div className="space-y-3 md:hidden">
              {isHomePage ? (
                <>
                  {/* Mini player: cover + play/pause + volume */}
                  <div className="flex items-center gap-3">
                    {currentVersion.cover_url && (
                      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-void">
                        <Image
                          src={currentVersion.cover_url}
                          alt={currentVersion.label}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-col min-w-0 flex-1">
                      <p className="text-sm font-medium text-bone truncate">
                        {currentVersion.label}
                      </p>
                      <p className="text-[11px] text-bone/60">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </p>
                    </div>

                    {/* Prev / Play/Pause / Next */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {queue.length > 1 && (
                        <button
                          onClick={previous}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer border"
                          style={{ borderColor: accentColor, color: accentColor }}
                          aria-label="Previous track"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          isPlaying
                            ? pause()
                            : play(currentVersion, currentVersion.song_id)
                        }
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-transform hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: accentColor }}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-void" fill="currentColor" />
                        ) : (
                          <Play className="w-5 h-5 text-void ml-0.5" fill="currentColor" />
                        )}
                      </button>
                      {queue.length > 1 && (
                        <button
                          onClick={next}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer border"
                          style={{ borderColor: accentColor, color: accentColor }}
                          aria-label="Next track"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {!isIOS && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Volume2 className="w-4 h-4 text-bone/70" style={{ color: accentColor }} />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (process.env.NODE_ENV === 'development') {
                              console.log('GlobalAudioPlayer volume change (mobile mini)', value)
                            }
                            setVolume(value)
                          }}
                          className="w-20 cursor-pointer 
                               [&::-webkit-slider-thumb]:appearance-none 
                               [&::-webkit-slider-thumb]:w-3.5 
                               [&::-webkit-slider-thumb]:h-3.5 
                               [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:bg-white
                               [&::-webkit-slider-thumb]:cursor-pointer"
                          style={{ accentColor }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Progress slider */}
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value)
                        setCurrentTime(time)
                      }}
                      className="w-full cursor-pointer 
                             [&::-webkit-slider-thumb]:appearance-none 
                             [&::-webkit-slider-thumb]:w-3.5 
                             [&::-webkit-slider-thumb]:h-3.5 
                             [&::-webkit-slider-thumb]:rounded-full 
                             [&::-webkit-slider-thumb]:bg-white
                             [&::-webkit-slider-thumb]:cursor-pointer"
                      style={{ accentColor }}
                    />
                  </div>

                  {/* Autoplay toggle */}
                  <div className="flex justify-end">
                    {renderAutoplayToggle()}
                  </div>
                </>
              ) : (
                <>
                  {/* Actions + rating summary */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRatingOpen(true)}
                        className="text-[11px] px-2 py-0.5 rounded-full border text-bone/80 hover:text-bone transition-colors cursor-pointer"
                        style={{
                          borderColor: `${accentColor}60`,
                          backgroundColor: 'transparent',
                        }}
                      >
                        Rate
                      </button>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="text-[11px] px-2 py-0.5 rounded-full border text-bone/80 hover:text-bone transition-colors cursor-pointer flex items-center gap-1"
                        style={{
                          borderColor: `${accentColor}60`,
                          backgroundColor: 'transparent',
                        }}
                        aria-label="Download audio"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>

                    {(hasRatingStats || hasUserRating) && (
                      <div className="flex flex-col items-end gap-0.5">
                        {hasRatingStats && ratingStats && (
                          <div className="flex items-center gap-1 text-[11px] text-bone/70">
                            <Star className="w-3 h-3" fill={accentColor} color={accentColor} />
                            <span>{ratingStats.avg_rating.toFixed(1)}/10</span>
                            <span className="text-bone/40">
                              ({ratingStats.rating_count}{' '}
                              {ratingStats.rating_count === 1 ? 'rating' : 'ratings'})
                            </span>
                          </div>
                        )}
                        {hasUserRating && userRating && (
                          <div className="text-[10px] text-bone/60">
                            Your:{' '}
                            <span style={{ color: accentColor }}>{userRating.rating}/10</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Autoplay toggle (mobile full layout) */}
                    {renderAutoplayToggle()}
                  </div>

                  {/* Player row */}
                  <div className="flex items-center gap-3">
                    {/* Left: Cover + label + time */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
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

                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-medium text-bone truncate">
                          {currentVersion.label}
                        </p>
                        <p className="text-[11px] text-bone/60">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </p>
                      </div>
                    </div>

                    {/* Center: Prev / Play/Pause / Next */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {queue.length > 1 && (
                        <button
                          onClick={previous}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer border"
                          style={{ borderColor: accentColor, color: accentColor }}
                          aria-label="Previous track"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          isPlaying
                            ? pause()
                            : play(currentVersion, currentVersion.song_id)
                        }
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-transform hover:scale-105 cursor-pointer"
                        style={{ backgroundColor: accentColor }}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-void" fill="currentColor" />
                        ) : (
                          <Play className="w-5 h-5 text-void ml-0.5" fill="currentColor" />
                        )}
                      </button>
                      {queue.length > 1 && (
                        <button
                          onClick={next}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer border"
                          style={{ borderColor: accentColor, color: accentColor }}
                          aria-label="Next track"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Right: Volume */}
                    {!isIOS && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Volume2 className="w-4 h-4 text-bone/70" style={{ color: accentColor }} />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (process.env.NODE_ENV === 'development') {
                              console.log('GlobalAudioPlayer volume change (mobile full)', value)
                            }
                            setVolume(value)
                          }}
                          className="w-20 cursor-pointer 
                               [&::-webkit-slider-thumb]:appearance-none 
                               [&::-webkit-slider-thumb]:w-3.5 
                               [&::-webkit-slider-thumb]:h-3.5 
                               [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:bg-white
                               [&::-webkit-slider-thumb]:cursor-pointer"
                          style={{ accentColor }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Progress slider */}
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value)
                        setCurrentTime(time)
                      }}
                      className="w-full cursor-pointer 
                             [&::-webkit-slider-thumb]:appearance-none 
                             [&::-webkit-slider-thumb]:w-3.5 
                             [&::-webkit-slider-thumb]:h-3.5 
                             [&::-webkit-slider-thumb]:rounded-full 
                             [&::-webkit-slider-thumb]:bg-white
                             [&::-webkit-slider-thumb]:cursor-pointer"
                      style={{ accentColor }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Desktop layout: original single-row player */}
            <div className="hidden md:flex items-center gap-4">
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
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-bone truncate flex-1">
                      {currentVersion.label}
                    </p>
                    {hasRatingStats && ratingStats && (
                      <div className="flex items-center gap-1 text-[11px] text-bone/70 flex-shrink-0">
                        <Star className="w-3 h-3" fill={accentColor} color={accentColor} />
                        <span>{ratingStats.avg_rating.toFixed(1)}/10</span>
                        <span className="text-bone/40">
                          ({ratingStats.rating_count}{' '}
                          {ratingStats.rating_count === 1 ? 'rating' : 'ratings'})
                        </span>
                      </div>
                    )}
                    {hasUserRating && userRating && (
                      <div className="text-[10px] text-bone/60 flex-shrink-0">
                        (You:{' '}
                        <span style={{ color: accentColor }}>{userRating.rating}/10</span>
                        )
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsRatingOpen(true)}
                      className="text-[11px] px-2 py-0.5 rounded-full border text-bone/80 hover:text-bone transition-colors flex-shrink-0 cursor-pointer"
                      style={{
                        borderColor: `${accentColor}60`,
                        backgroundColor: 'transparent',
                      }}
                    >
                      Rate
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="text-[11px] p-1 rounded-full border text-bone/80 hover:text-bone transition-colors flex-shrink-0 cursor-pointer flex items-center justify-center"
                      style={{
                        borderColor: `${accentColor}60`,
                        backgroundColor: 'transparent',
                      }}
                      aria-label="Download audio"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-bone/60">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>
              </div>

              {/* Center: Prev / Play/Pause / Next */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {queue.length > 1 && (
                  <button
                    onClick={previous}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer border"
                    style={{ borderColor: accentColor, color: accentColor }}
                    aria-label="Previous track"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() =>
                    isPlaying
                      ? pause()
                      : play(currentVersion, currentVersion.song_id)
                  }
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-transform hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-void" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 text-void ml-0.5" fill="currentColor" />
                  )}
                </button>
                {queue.length > 1 && (
                  <button
                    onClick={next}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 cursor-pointer border"
                    style={{ borderColor: accentColor, color: accentColor }}
                    aria-label="Next track"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                )}
              </div>

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
              {!isIOS && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Volume2 className="w-4 h-4 text-bone/70" style={{ color: accentColor }} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      if (process.env.NODE_ENV === 'development') {
                        console.log('GlobalAudioPlayer volume change (desktop)', value)
                      }
                      setVolume(value)
                    }}
                    className="w-24 cursor-pointer 
                               [&::-webkit-slider-thumb]:appearance-none 
                               [&::-webkit-slider-thumb]:w-3.5 
                               [&::-webkit-slider-thumb]:h-3.5 
                               [&::-webkit-slider-thumb]:rounded-full 
                               [&::-webkit-slider-thumb]:bg-white
                               [&::-webkit-slider-thumb]:cursor-pointer"
                    style={{ accentColor }}
                  />
                </div>
              )}

              {/* Autoplay toggle (desktop) */}
              <div className="flex-shrink-0">
                {renderAutoplayToggle()}
              </div>
            </div>
          </div>
        </div>
      )}
      <RatingModal
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        onRated={() => setRatingRefreshToken((token) => token + 1)}
      />
    </>
  )
}
