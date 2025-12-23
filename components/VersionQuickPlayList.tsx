'use client'

/**
 * Compact list of version tracks for quick play/pause in album header.
 * Shows version name, duration, like button, and play control.
 */

import { Play, Pause, Heart } from 'lucide-react'
import type { ExtendedVersion } from '@/components/VersionOrb'
import { useLikes } from '@/hooks/useLikes'
import { useAuth } from '@/hooks/useAuth'

interface VersionQuickPlayListProps {
  versions: ExtendedVersion[]
  currentVersionId: string | null | undefined
  isPlaying: boolean
  onVersionClick: (version: ExtendedVersion) => void
  accentColor?: string
}

// Format duration from seconds to MM:SS
function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VersionQuickPlayList({
  versions,
  currentVersionId,
  isPlaying,
  onVersionClick,
  accentColor = '#4F9EFF'
}: VersionQuickPlayListProps) {
  const { isLiked, toggleLike } = useLikes()
  const { isAuthenticated } = useAuth()

  if (versions.length === 0) return null

  return (
    <div className="flex flex-col gap-1 w-full max-w-[320px] md:max-w-[400px]">
      {/* Header label */}
      <div className="text-xs text-bone/40 uppercase tracking-wide px-2 mb-1">
        Versions
      </div>
      
      {/* Version list */}
      <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto scrollbar-hide">
        {versions.map((version) => {
          const isCurrentVersion = version.id === currentVersionId
          const isThisPlaying = isCurrentVersion && isPlaying
          const liked = isLiked(version.id)

          return (
            <div
              key={version.id}
              className={`
                group flex items-center gap-2 px-2 py-1.5 rounded-lg
                transition-all duration-150
                ${isCurrentVersion 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
                }
              `}
            >
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={() => onVersionClick(version)}
                className={`
                  flex-shrink-0 w-7 h-7 rounded-full
                  flex items-center justify-center
                  transition-all duration-150
                  cursor-pointer
                  ${isCurrentVersion
                    ? 'bg-[var(--album-accent1,#4F9EFF)] text-black'
                    : 'bg-white/10 text-bone/70 hover:bg-white/20 hover:text-bone'
                  }
                `}
                style={isCurrentVersion ? { backgroundColor: accentColor } : undefined}
                title={isThisPlaying ? 'Pause' : 'Play'}
              >
                {isThisPlaying ? (
                  <Pause className="w-3.5 h-3.5" fill="currentColor" />
                ) : (
                  <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />
                )}
              </button>

              {/* Version Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Version Label */}
                <span className={`
                  text-sm truncate
                  ${isCurrentVersion ? 'text-bone font-medium' : 'text-bone/80'}
                `}>
                  {version.label}
                </span>
                {/* Song Title (if different from label) */}
                {version.songTitle && version.songTitle !== version.label && (
                  <span className="text-xs text-bone/50 truncate">
                    {version.songTitle}
                  </span>
                )}
              </div>

              {/* Duration */}
              <span className="flex-shrink-0 text-xs text-bone/50 tabular-nums">
                {formatDuration(version.duration_sec)}
              </span>

              {/* Like Button */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(version.id)
                  }}
                  className={`
                    flex-shrink-0 p-1 rounded-full
                    transition-all duration-150 cursor-pointer
                    ${liked 
                      ? 'text-red-500' 
                      : 'text-bone/30 hover:text-bone/60 opacity-0 group-hover:opacity-100'
                    }
                  `}
                  title={liked ? 'Unlike' : 'Like'}
                >
                  <Heart 
                    className="w-4 h-4" 
                    fill={liked ? 'currentColor' : 'none'} 
                  />
                </button>
              )}

              {/* Playing Indicator Animation */}
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
        })}
      </div>
    </div>
  )
}
