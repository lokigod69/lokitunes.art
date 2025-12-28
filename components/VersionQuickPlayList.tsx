'use client'

/**
 * Compact list of version tracks for quick play/pause in album header.
 * Shows version name, duration, like button, and play control.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Play, Pause, Heart, Star, Check } from 'lucide-react'
import type { ExtendedVersion } from '@/components/VersionOrb'
import { useLikes } from '@/hooks/useLikes'
import { useAuth } from '@/hooks/useAuth'
import { useAudioStore } from '@/lib/audio-store'

interface VersionQuickPlayListProps {
  versions: ExtendedVersion[]
  currentVersionId: string | null | undefined
  isPlaying: boolean
  onVersionClick: (version: ExtendedVersion) => void
  onRateClick?: (version: ExtendedVersion) => void
  accentColor?: string
  albumCoverUrl?: string
}

// Format time from seconds to M:SS
function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds === 0) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VersionQuickPlayList({
  versions,
  currentVersionId,
  isPlaying,
  onVersionClick,
  onRateClick,
  accentColor = '#4F9EFF',
  albumCoverUrl
}: VersionQuickPlayListProps) {
  const { isLiked, toggleLike } = useLikes()
  const { isAuthenticated } = useAuth()
  const { currentTime, duration } = useAudioStore()
  const [toastMessage, setToastMessage] = useState<{ text: string; isAdd: boolean } | null>(null)

  const useTwoColumnsOnDesktop = versions.length > 3
  const leftColumn = useTwoColumnsOnDesktop ? versions.slice(0, 3) : versions
  const rightColumn = useTwoColumnsOnDesktop ? versions.slice(3) : []

  // Handle like with toast notification
  const handleLikeClick = async (versionId: string, currentlyLiked: boolean) => {
    const success = await toggleLike(versionId)
    if (success) {
      setToastMessage({ 
        text: currentlyLiked ? 'Removed from liked songs' : 'Added to liked songs',
        isAdd: !currentlyLiked
      })
      setTimeout(() => setToastMessage(null), 2000)
    }
  }

  if (versions.length === 0) return null

  const renderRow = (version: ExtendedVersion) => {
    const isCurrentVersion = version.id === currentVersionId
    const isThisPlaying = isCurrentVersion && isPlaying
    const liked = isLiked(version.id)

    const coverUrl = version.cover_url || albumCoverUrl || null

    return (
      <div
        key={version.id}
        onClick={() => onVersionClick(version)}
        className={`
                group flex items-center md:items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                transition-all duration-150
                ${isCurrentVersion 
                  ? 'bg-white/10 border border-white/20' 
                  : 'hover:bg-white/5 border border-transparent'
                }
              `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onVersionClick(version)}
      >
        <div
          className="relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden"
          title={isThisPlaying ? 'Pause' : 'Play'}
        >
          {coverUrl ? (
            <img 
              src={coverUrl}
              alt={version.label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center bg-white/10"
              style={{ backgroundColor: accentColor + '30' }}
            >
              <span className="text-sm">🎵</span>
            </div>
          )}
          
          <div className={`
                  absolute inset-0 flex items-center justify-center
                  transition-all duration-150
                  ${isCurrentVersion 
                    ? 'bg-black/40' 
                    : 'bg-black/0 group-hover:bg-black/50 opacity-0 group-hover:opacity-100'
                  }
                `}>
            {isThisPlaying ? (
              <Pause className="w-4 h-4 text-white" fill="currentColor" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <span className={`
                  text-sm truncate md:whitespace-normal md:overflow-visible md:text-clip md:break-words
                  ${isCurrentVersion ? 'text-bone font-medium' : 'text-bone/80'}
                `}>
            {version.label}
          </span>
          {version.songTitle && version.songTitle !== version.label && (
            <span className="text-xs text-bone/50 truncate md:whitespace-normal md:overflow-visible md:text-clip md:break-words">
              {version.songTitle}
            </span>
          )}
        </div>

        <span className="flex-shrink-0 text-xs text-bone/50 tabular-nums min-w-[70px] text-right">
          {isCurrentVersion ? (
            <>{formatTime(currentTime)} / {formatTime(duration || version.duration_sec)}</>
          ) : (
            formatTime(version.duration_sec)
          )}
        </span>

        {isAuthenticated && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleLikeClick(version.id, liked)
            }}
            className={`
                    flex-shrink-0 p-1.5 rounded-full
                    transition-all duration-150 cursor-pointer
                    ${liked 
                      ? 'text-red-500' 
                      : 'text-bone/50 hover:text-red-400'
                    }
                  `}
            title={liked ? 'Remove from liked songs' : 'Add to liked songs'}
          >
            <Heart 
              className="w-4 h-4" 
              fill={liked ? 'currentColor' : 'none'} 
            />
          </button>
        )}

        {onRateClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRateClick(version)
            }}
            className="flex-shrink-0 p-1 rounded-full text-bone/30 hover:text-yellow-400 transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100"
            title="Rate this version"
          >
            <Star className="w-4 h-4" />
          </button>
        )}

        {isThisPlaying && (
          <div className="flex-shrink-0 flex items-end gap-0.5 h-4">
            <span 
              className="w-0.5 bg-current animate-pulse rounded-full"
              style={{ 
                height: '60%', 
                animationDelay: '0ms',
                color: accentColor 
              }} 
            />
            <span 
              className="w-0.5 bg-current animate-pulse rounded-full"
              style={{ 
                height: '100%', 
                animationDelay: '150ms',
                color: accentColor 
              }} 
            />
            <span 
              className="w-0.5 bg-current animate-pulse rounded-full"
              style={{ 
                height: '40%', 
                animationDelay: '300ms',
                color: accentColor 
              }} 
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 w-full max-w-[320px] md:max-w-[520px] relative">
      {/* Toast notification - rendered via portal above bottom player */}
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

      {/* Header label */}
      <div className="text-xs text-bone/40 uppercase tracking-wide px-2 mb-1">
        Versions
      </div>
      
      {/* Version list */}
      <div className="scrollbar-hide max-h-[200px] overflow-y-auto md:max-h-none md:overflow-visible">
        {useTwoColumnsOnDesktop ? (
          <div className="flex flex-col gap-0.5 md:grid md:grid-cols-2 md:gap-2">
            <div className="flex flex-col gap-0.5">
              {leftColumn.map(renderRow)}
            </div>
            <div className="flex flex-col gap-0.5">
              {rightColumn.map(renderRow)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {versions.map(renderRow)}
          </div>
        )}
      </div>
    </div>
  )
}
