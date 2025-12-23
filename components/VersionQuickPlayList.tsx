'use client'

/**
 * Compact list of version tracks for quick play/pause in album header.
 * Shows version name, duration, like button, and play control.
 */

import { Play, Pause, Heart, Star } from 'lucide-react'
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
  if (!seconds || isNaN(seconds)) return '0:00'
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

          // Get cover URL - prefer version cover, fallback to album cover
          const coverUrl = version.cover_url || albumCoverUrl || null

          return (
            <div
              key={version.id}
              className={`
                group flex items-center gap-2 px-2 py-1.5 rounded-lg
                transition-all duration-150
                ${isCurrentVersion 
                  ? 'bg-white/10 border border-white/20' 
                  : 'hover:bg-white/5 border border-transparent'
                }
              `}
            >
              {/* Cover Art Thumbnail with Play/Pause Overlay */}
              <button
                type="button"
                onClick={() => onVersionClick(version)}
                className="relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden cursor-pointer"
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
                
                {/* Play/Pause Overlay */}
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

              {/* Time Display */}
              <span className="flex-shrink-0 text-xs text-bone/50 tabular-nums min-w-[70px] text-right">
                {isCurrentVersion ? (
                  // Show current time / total duration for playing track
                  <>{formatTime(currentTime)} / {formatTime(duration || version.duration_sec)}</>
                ) : (
                  // Show total duration for other tracks
                  formatTime(version.duration_sec)
                )}
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

              {/* Rate Button */}
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
