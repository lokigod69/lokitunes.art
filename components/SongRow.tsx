'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { SongWithVersions } from '@/lib/supabase'

const WaveformPlayer = dynamic(() => import('./WaveformPlayer').then((m) => m.WaveformPlayer), {
  ssr: false,
  loading: () => (
    <div className="h-[92px] rounded-lg bg-void/30 flex items-center justify-center">
      <div className="animate-pulse text-bone/50 text-sm">Loading...</div>
    </div>
  ),
})

interface SongRowProps {
  song: SongWithVersions
  accentColor?: string
}

export function SongRow({ song, accentColor }: SongRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border-b border-bone/10">
      {/* Song Title Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-bone/5 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-bone/70 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-bone/70 flex-shrink-0" />
        )}
        
        {song.track_no && (
          <span className="text-bone/50 font-mono text-sm w-8 flex-shrink-0">
            {song.track_no.toString().padStart(2, '0')}
          </span>
        )}
        
        <span className="text-bone text-lg font-medium flex-1">
          {song.title}
        </span>
        
        <span className="text-bone/50 text-sm flex-shrink-0">
          {song.versions.length} {song.versions.length === 1 ? 'version' : 'versions'}
        </span>
      </button>

      {/* Version Rows */}
      {isExpanded && (
        <div className="bg-void/50 space-y-2 p-4">
          {song.versions.map((version) => (
            <div key={version.id} className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Version cover thumbnail */}
                {version.cover_url ? (
                  <img 
                    src={version.cover_url}
                    alt={version.label}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-white/10"
                    onError={(e) => {
                      console.error('Failed to load version cover:', version.cover_url)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-void/50 flex items-center justify-center flex-shrink-0 border border-white/10">
                    <span className="text-bone/30 text-xs">♪</span>
                  </div>
                )}
                
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-bone/70 text-sm font-medium">
                    {version.label}
                  </span>
                  {version.play_count > 0 && (
                    <span className="text-bone/40 text-xs">
                      {version.play_count} plays
                    </span>
                  )}
                </div>
              </div>
              <WaveformPlayer version={version} songId={song.id} accentColor={accentColor} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
