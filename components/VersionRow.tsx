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
    <div className="group">
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-200">
        {/* Cover Art Thumbnail */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
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
        
        {/* Play Button */}
        <button
          onClick={onPlay}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-voltage hover:bg-voltage/80 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-voltage/50"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-void" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 text-void ml-0.5" fill="currentColor" />
          )}
        </button>
        
        {/* Version Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-bone truncate group-hover:text-voltage transition-colors">
            {version.label}
          </h3>
          {version.play_count > 0 && (
            <p className="text-xs text-bone/40">
              {version.play_count} {version.play_count === 1 ? 'play' : 'plays'}
            </p>
          )}
        </div>
        
        {/* Duration */}
        <div className="text-sm text-bone/50 flex-shrink-0 font-mono">
          {formatDuration(version.duration_sec)}
        </div>
      </div>
      
      {/* Subtle divider line */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}
