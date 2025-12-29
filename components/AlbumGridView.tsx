'use client'

/**
 * 2D grid view for album versions on mobile.
 * Alternative to 3D orb view - simpler, faster, more accessible.
 */

import Image from 'next/image'
import { Play, Pause } from 'lucide-react'
import { useAudioStore } from '@/lib/audio-store'
import type { ExtendedVersion } from '@/components/VersionOrb'
import type { Album } from '@/lib/supabase'

interface AlbumGridViewProps {
  versions: ExtendedVersion[]
  albumPalette?: Album['palette'] | null
}

export function AlbumGridView({ versions, albumPalette }: AlbumGridViewProps) {
  const currentVersion = useAudioStore((state) => state.currentVersion)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const play = useAudioStore((state) => state.play)
  const pause = useAudioStore((state) => state.pause)
  const autoplayMode = useAudioStore((state) => state.autoplayMode)
  const startAlbumQueue = useAudioStore((state) => state.startAlbumQueue)
  const startGlobalQueue = useAudioStore((state) => state.startGlobalQueue)

  const accentColor = albumPalette?.accent1 || '#4F9EFF'
  const dominantColor = albumPalette?.dominant || '#1a1a1a'

  const handleVersionClick = (version: ExtendedVersion) => {
    const isCurrentTrack = currentVersion?.id === version.id

    if (isCurrentTrack) {
      // Toggle play/pause for current track
      if (isPlaying) {
        pause()
      } else {
        play(version, version.songId || version.song_id || '')
      }
    } else {
      // Start playback based on autoplay mode
      if (autoplayMode === 'all') {
        startGlobalQueue(version, albumPalette)
      } else if (autoplayMode === 'album' && versions.length > 1) {
        startAlbumQueue(versions, version.id, albumPalette)
      } else {
        play(version, version.songId || version.song_id || '', albumPalette)
      }
    }
  }

  return (
    <div className="w-full">
      {/* Version Grid */}
      <div className="grid grid-cols-2 gap-3">
        {versions.map((version) => {
          const isCurrentTrack = currentVersion?.id === version.id
          const isCurrentlyPlaying = isCurrentTrack && isPlaying
          
          return (
            <button
              key={version.id}
              type="button"
              onClick={() => handleVersionClick(version)}
              className={`
                relative aspect-square rounded-xl overflow-hidden
                border-2 transition-all duration-200
                ${isCurrentTrack 
                  ? 'border-white shadow-lg scale-[1.02]' 
                  : 'border-white/10 hover:border-white/30 active:scale-[0.98]'
                }
              `}
              style={{
                backgroundColor: dominantColor,
              }}
            >
              {/* Version Cover */}
              {version.cover_url ? (
                <Image 
                  src={version.cover_url} 
                  alt={version.label}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: accentColor + '30' }}
                >
                  <span className="text-4xl">🎵</span>
                </div>
              )}

              {/* Overlay with info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                <span className="text-white font-semibold text-base truncate drop-shadow-lg">
                  {version.label}
                </span>
                {version.songTitle && (
                  <span className="text-white/70 text-sm truncate">
                    {version.songTitle}
                  </span>
                )}
              </div>

              {/* Playing indicator */}
              {isCurrentTrack && (
                <div 
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-4 h-4 text-void" fill="currentColor" />
                  ) : (
                    <Play className="w-4 h-4 text-void ml-0.5" fill="currentColor" />
                  )}
                </div>
              )}

              {/* Hover/touch play indicator (when not current) */}
              {!isCurrentTrack && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity bg-black/30">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Play className="w-6 h-6 text-void ml-0.5" fill="currentColor" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {versions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-bone/50">No versions available</p>
        </div>
      )}
    </div>
  )
}
