'use client'

import { Play, Pause } from 'lucide-react'
import Image from 'next/image'
import { getSongCoverUrl, getAlbumCoverUrl } from '@/lib/supabase-images'
import type { SongVersion } from '@/lib/supabase'

interface VersionRowProps {
  version: SongVersion
  albumSlug: string
  albumTitle: string
  isPlaying: boolean
  onPlay: () => void
}

export function VersionRow({ 
  version, 
  albumSlug, 
  albumTitle,
  isPlaying, 
  onPlay 
}: VersionRowProps) {
  // Get possible cover URLs
  const songCoverUrls = version.audio_url 
    ? getSongCoverUrl(albumSlug, version.audio_url.split('/').pop() || '')
    : []
  const albumCoverUrls = getAlbumCoverUrl(albumSlug)
  const fallbackUrl = songCoverUrls[0] || albumCoverUrls[0] || ''
  
  // Format duration
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className={`group version-row${isPlaying ? ' version-row--playing' : ''}`}>
      <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-white/5 transition-all duration-200">
        {/* Cover Art Thumbnail - smaller on mobile */}
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-md overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
          {fallbackUrl ? (
            <Image
              src={fallbackUrl}
              alt={version.label}
              fill
              className="object-cover"
              onError={(e) => {
                // Try album cover as fallback
                const target = e.target as HTMLImageElement
                if (albumCoverUrls[0] && target.src !== albumCoverUrls[0]) {
                  target.src = albumCoverUrls[0]
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/30 text-xs">♪</span>
            </div>
          )}
        </div>
        
        {/* Play Button - responsive sizing */}
        <button
          onClick={onPlay}
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-voltage hover:bg-voltage/80 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-voltage/50"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-void" fill="currentColor" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-void ml-0.5" fill="currentColor" />
          )}
        </button>
        
        {/* Version Info - responsive text */}
        <div className="flex-1 min-w-0">
          <h3 className="version-row__label text-xs sm:text-sm md:text-base font-medium text-bone truncate transition-colors">
            {version.label}
          </h3>
          {version.play_count > 0 && (
            <p className="text-xs text-bone/40">
              {version.play_count} {version.play_count === 1 ? 'play' : 'plays'}
            </p>
          )}
        </div>
        
        {/* Duration - hidden on small mobile */}
        <div className="hidden sm:block text-xs sm:text-sm text-bone/50 flex-shrink-0 font-mono">
          {formatDuration(version.duration_sec)}
        </div>
      </div>
      
      {/* Subtle divider line */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}
