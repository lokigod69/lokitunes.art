'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useAudioStore } from '@/lib/audio-store'
import { useMediaSession } from '@/hooks/useMediaSession'
import { Play, Pause, Star, Volume2, Volume1, VolumeX, Download, SkipBack, SkipForward, Infinity as InfinityIcon, Heart, Check } from 'lucide-react'
import Image from 'next/image'
import { RatingModal } from '@/components/RatingModal'
import { useLikes } from '@/hooks/useLikes'
import { useAuth } from '@/hooks/useAuth'

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
    isMuted,
    play, 
    playStandalone,
    pause, 
    setCurrentTime,
    setVolume,
    toggleMute,
    autoplayMode,
    setAutoplayMode,
    next,
    previous,
    queue,
  } = useAudioStore()
  const pathname = usePathname()
  const router = useRouter()
  const isHomePage = pathname === '/'
  const [isIOS, setIsIOS] = useState(false)

  // Enable Media Session API for iOS/Android lock screen controls and background playback
  useMediaSession()

  // Extract album info from extended version data (available from global queue)
  const extended = currentVersion as unknown as { albumSlug?: string; albumTitle?: string }
  const albumTitle = extended?.albumTitle
  const albumSlug = extended?.albumSlug

  // Navigate to album page when clicking on song title
  const handleTitleClick = () => {
    if (!currentVersion) return
    let slug = albumSlug
    
    // Fallback: extract from current pathname if on album page
    if (!slug && pathname.startsWith('/album/')) {
      slug = pathname.replace('/album/', '')
    }
    
    if (slug && pathname !== `/album/${slug}`) {
      router.push(`/album/${slug}`)
    }
  }

  // Format display title: "Album Title — Version Label" or just "Version Label"
  const displayTitle = albumTitle 
    ? `${albumTitle} — ${currentVersion?.label}` 
    : currentVersion?.label

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
  const [userRating, setUserRating] = useState<UserRating | null>(null)
  const [isRatingLoading, setIsRatingLoading] = useState(false)
  const [ratingRefreshToken, setRatingRefreshToken] = useState(0)
  const versionId = currentVersion?.id
  const isOriginal = !!currentVersion?.is_original
  // Always allow skip when: not original AND (has queue OR autoplay enabled)
  // This ensures prev/next are always visible for version tracks
  const canSkip = !isOriginal && (queue.length > 0 || autoplayMode !== 'off')

  const { isAuthenticated } = useAuth()
  const { isLiked, toggleLike } = useLikes()
  const liked = versionId ? isLiked(versionId) : false
  const [toastMessage, setToastMessage] = useState<{ text: string; isAdd: boolean } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLikeClick = async (targetVersionId: string, currentlyLiked: boolean) => {
    const success = await toggleLike(targetVersionId)
    if (!success) return

    setToastMessage({
      text: currentlyLiked ? 'Removed from liked songs' : 'Added to liked songs',
      isAdd: !currentlyLiked,
    })

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2000)
  }

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!versionId || isOriginal) {
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
        setUserRating(data.userRating || null)
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load ratings for player:', error)
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
  }, [versionId, ratingRefreshToken, isOriginal])

  useEffect(() => {
    if (isOriginal) {
      setIsRatingOpen(false)
    }
  }, [isOriginal])

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

  const hasUserRating = !isRatingLoading && !!userRating
  const isRated = hasUserRating

  const renderAutoplayToggle = (compact: boolean = false) => {
    if (!currentVersion || isOriginal) return null
    const modes: { mode: 'off' | 'album' | 'all'; label: string; compactLabel: string }[] = [
      { mode: 'off', label: 'Off', compactLabel: '✕' },
      { mode: 'album', label: 'Album', compactLabel: 'A' },
      { mode: 'all', label: 'All', compactLabel: '∞' },
    ]
    return (
      <div className="flex items-center gap-1 text-[10px] text-bone/60">
        {!compact && <span className="uppercase tracking-wide">Autoplay</span>}
        {modes.map(({ mode, label, compactLabel }) => (
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
            title={`Autoplay: ${label}`}
          >
            {compact ? compactLabel : label}
          </button>
        ))}
      </div>
    )
  }


  return (
    <>
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-void/95 border border-white/20 text-bone text-sm whitespace-nowrap z-[100] animate-fade-in flex items-center gap-2 shadow-lg">
          {toastMessage.isAdd ? (
            <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
          ) : (
            <Check className="w-4 h-4 text-green-500" />
          )}
          {toastMessage.text}
        </div>,
        document.body
      )}
      {/* Player UI only shows when there's a track */}
      {currentVersion && (
        <div
          className="player fixed bottom-0 left-0 right-0 bg-void/95 backdrop-blur-lg border-t z-50"
          style={{
            borderTopColor: `${accentColor}30`,
            background: `linear-gradient(to top, ${accentColor}18 0%, ${accentColor}08 50%, transparent 100%)`,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-3">
            {/* Mobile layout - Controls row + Progress bar */}
            <div className="flex flex-col w-full md:hidden">
              {/* Row 1: Controls */}
              <div className="flex items-center gap-2">
                {/* Cover art - small */}
                {currentVersion.cover_url && (
                  <div className="relative w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-void">
                    <Image
                      src={currentVersion.cover_url}
                      alt={currentVersion.label}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Heart button */}
                {isAuthenticated && versionId && (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation()
                      await handleLikeClick(versionId, liked)
                    }}
                    className="p-1.5 cursor-pointer"
                    title={liked ? 'Unlike' : 'Like'}
                  >
                    <Heart
                      className={
                        'w-4 h-4 transition-colors ' +
                        (liked ? 'fill-red-500 text-red-500' : 'text-bone/50 hover:text-red-400')
                      }
                    />
                  </button>
                )}

                {/* Title + Time/Rating stacked */}
                <div className="flex flex-col min-w-0 flex-1" onClick={handleTitleClick}>
                  <span className="text-xs font-medium text-bone truncate cursor-pointer hover:underline">
                    {displayTitle}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-bone/50">
                    <span className="tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    {hasUserRating && userRating && (
                      <>
                        <span>|</span>
                        <span style={{ color: accentColor }}>
                          {Number.isInteger(userRating.rating)
                            ? userRating.rating.toFixed(0)
                            : userRating.rating.toFixed(1)}
                          /10
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Rate button - icon only (hide for originals) */}
                {!isOriginal && (
                  <button
                    type="button"
                    onClick={() => setIsRatingOpen(true)}
                    className="p-1.5 cursor-pointer"
                    title="Rate"
                  >
                    <Star
                      className="w-4 h-4"
                      color={accentColor}
                      fill={isRated ? accentColor : 'transparent'}
                    />
                  </button>
                )}

                {/* Shuffle toggle - single button cycling through states */}
                {!isOriginal && (
                  <button
                    type="button"
                    onClick={() => {
                      const modes: ('off' | 'album' | 'all')[] = ['off', 'album', 'all']
                      const currentIndex = modes.indexOf(autoplayMode)
                      const nextIndex = (currentIndex + 1) % modes.length
                      setAutoplayMode(modes[nextIndex])
                    }}
                    className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded border cursor-pointer"
                    style={{
                      borderColor: autoplayMode !== 'off' ? accentColor : 'rgba(255,255,255,0.2)',
                      color: autoplayMode !== 'off' ? accentColor : 'rgba(255,255,255,0.5)',
                    }}
                    title={`Autoplay: ${autoplayMode}`}
                  >
                    {autoplayMode === 'off' ? '✕' : autoplayMode === 'album' ? 'A' : '∞'}
                  </button>
                )}

                {/* Transport controls - tight layout */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={previous}
                    disabled={!canSkip}
                    className={`p-1 ${canSkip ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                    style={{ color: canSkip ? accentColor : `${accentColor}40` }}
                    aria-label="Previous"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      isPlaying
                        ? pause()
                        : isOriginal
                          ? playStandalone(currentVersion, currentVersion.song_id)
                          : play(currentVersion, currentVersion.song_id)
                    }
                    className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-void" fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4 text-void ml-0.5" fill="currentColor" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canSkip}
                    className={`p-1 ${canSkip ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                    style={{ color: canSkip ? accentColor : `${accentColor}40` }}
                    aria-label="Next"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Progress/Seek bar */}
              <div className="pt-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value)
                    setCurrentTime(time)
                  }}
                  className="w-full h-1 cursor-pointer appearance-none rounded-full
                           [&::-webkit-slider-thumb]:appearance-none 
                           [&::-webkit-slider-thumb]:w-3 
                           [&::-webkit-slider-thumb]:h-3 
                           [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:bg-white
                           [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{ 
                    accentColor,
                    background: `linear-gradient(to right, ${accentColor} ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
                  }}
                />
              </div>
            </div>

            {/* Desktop layout: 3-section fixed player */}
            <div className="hidden md:flex items-center gap-4">
              {/* LEFT: Cover + Info (FIXED width for layout stability) */}
              <div className="flex items-center gap-3 w-[260px] flex-shrink-0 overflow-hidden">
                {currentVersion.cover_url && (
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-void">
                    <Image
                      src={currentVersion.cover_url}
                      alt={currentVersion.label}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col min-w-0 gap-0.5">
                  {/* Row 1: Album — Version title */}
                  <p 
                    className="text-sm font-medium text-bone cursor-pointer hover:underline flex items-center gap-2 min-w-0"
                    onClick={handleTitleClick}
                    title="Go to album"
                  >
                    <span className="truncate max-w-[140px] md:max-w-none">{displayTitle}</span>
                    {isAuthenticated && versionId && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation()
                          await handleLikeClick(versionId, liked)
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        title={liked ? 'Unlike' : 'Like'}
                        aria-label={liked ? 'Unlike' : 'Like'}
                      >
                        <Heart
                          className={
                            'w-4 h-4 transition-colors ' +
                            (liked ? 'fill-red-500 text-red-500' : 'text-bone/50 hover:text-red-400')
                          }
                        />
                      </button>
                    )}
                    {isOriginal && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-bone/60 flex-shrink-0">
                        Original
                      </span>
                    )}
                  </p>
                  
                  {/* Row 2: Ratings + Rate + Download */}
                  <div className="flex items-center gap-2 overflow-hidden">
                    {!isOriginal && !isRatingLoading && userRating && (
                      <div className="flex items-center gap-1 text-[10px] text-bone/70">
                        <span className="text-bone/40">Your rating:</span>
                        <span style={{ color: accentColor }}>
                          {Number.isInteger(userRating.rating)
                            ? userRating.rating.toFixed(0)
                            : userRating.rating.toFixed(1)}
                          /10
                        </span>
                      </div>
                    )}
                    {!isOriginal && (
                      <button
                        type="button"
                        onClick={() => setIsRatingOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-zinc-700 hover:border-[var(--voltage)] transition-colors text-xs cursor-pointer"
                        title="Rate this version"
                      >
                        <Star
                          className="w-3.5 h-3.5"
                          color={accentColor}
                          fill={isRated ? accentColor : 'transparent'}
                        />
                        <span className="text-[10px]">Rate</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="text-[10px] p-0.5 rounded-full border text-bone/80 hover:text-bone transition-colors cursor-pointer flex items-center justify-center"
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
                </div>
              </div>

              {/* CENTER: Player controls + Progress bar (FIXED width) */}
              <div className="flex items-center gap-3 flex-1 min-w-[400px]">
                {/* Transport controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={previous}
                    disabled={!canSkip}
                    className={
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all border " +
                      (canSkip
                        ? 'hover:scale-105 cursor-pointer'
                        : 'opacity-30 cursor-not-allowed')
                    }
                    style={{
                      borderColor: canSkip ? accentColor : `${accentColor}40`,
                      color: canSkip ? accentColor : `${accentColor}40`,
                    }}
                    aria-label="Previous track"
                    title={canSkip ? 'Previous track' : 'No other tracks'}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      isPlaying
                        ? pause()
                        : isOriginal
                          ? playStandalone(currentVersion, currentVersion.song_id)
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
                  <button
                    type="button"
                    onClick={next}
                    disabled={!canSkip}
                    className={
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all border " +
                      (canSkip
                        ? 'hover:scale-105 cursor-pointer'
                        : 'opacity-30 cursor-not-allowed')
                    }
                    style={{
                      borderColor: canSkip ? accentColor : `${accentColor}40`,
                      color: canSkip ? accentColor : `${accentColor}40`,
                    }}
                    aria-label="Next track"
                    title={canSkip ? 'Next track' : 'No other tracks'}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar (fills remaining center space) */}
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
              </div>

              {/* RIGHT: Time + Volume + Autoplay (fixed width) */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Time display */}
                <span className="text-xs text-bone/60 tabular-nums w-[85px] text-center">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume */}
                {!isIOS && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" style={{ color: accentColor }} />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4" style={{ color: accentColor }} />
                      ) : (
                        <Volume2 className="w-4 h-4" style={{ color: accentColor }} />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
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

                {/* Autoplay toggle */}
                {renderAutoplayToggle()}
              </div>
            </div>
          </div>
        </div>
      )}
      <RatingModal
        isOpen={isRatingOpen && !isOriginal}
        onClose={() => setIsRatingOpen(false)}
        onRated={() => setRatingRefreshToken((token) => token + 1)}
      />
    </>
  )
}
