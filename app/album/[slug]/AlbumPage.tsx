'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AlbumGridView } from '@/components/AlbumGridView'
import { OriginalTrackInfo } from '@/components/OriginalTrackInfo'
import { SpectrumAnalyzer } from '@/components/SpectrumAnalyzer'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import type { ExtendedVersion } from '@/components/VersionOrb'
import type { AlbumWithSongs } from '@/lib/supabase'
import { devLog } from '@/lib/debug'

function hexWithOpacity(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

interface AlbumPageProps {
  album: AlbumWithSongs
}

export function AlbumPage({ album }: AlbumPageProps) {
  const isMobile = useMobileDetection(768)

  // 🔥🔥🔥 DEBUG: Log exact palette received on CLIENT
  devLog('🔥🔥🔥 CLIENT (AlbumPage): Received album:', album.slug, {
    palette: album.palette,
    dominantColor: album.palette?.dominant,
    dominantLength: album.palette?.dominant?.length,
    accent1Color: album.palette?.accent1,
    accent1Length: album.palette?.accent1?.length,
  })

  const palette = album.palette || {
    dominant: '#090B0D',
    accent1: '#4F9EFF',
    accent2: '#FF6B4A',
  }
  
  // 🔥 DEBUG: Log processed palette
  devLog('🔥 CLIENT (AlbumPage): Using palette:', palette)

  // Flatten all versions for orb field (each MP3 = one orb)
  const allVersions: ExtendedVersion[] = useMemo(() => {
    const versions = album.songs
      .sort((a, b) => (a.track_no || 0) - (b.track_no || 0))  // Sort by track number
      .flatMap(song => 
        song.versions.map(version => ({
          ...version,
          songTitle: song.title,
          songId: song.id,
          trackNo: song.track_no,
          albumTitle: album.title,
          albumSlug: album.slug
        }))
      )
    
    // Debug logging - verify orb count
    devLog(`🎵 Album "${album.title}": ${versions.length} versions found`)
    versions.forEach((v, i) => devLog(`  Version ${i + 1}: ${v.label}`))
    
    return versions
  }, [album])

  const orbVersions: ExtendedVersion[] = useMemo(() => {
    const nonOriginal = allVersions.filter((v) => !v.is_original)
    return nonOriginal.length > 0 ? nonOriginal : allVersions
  }, [allVersions])

  const VersionOrbField3D = useMemo(() => {
    return dynamic(() => import('@/components/VersionOrbField').then((m) => m.VersionOrbField), {
      ssr: false,
      loading: () => (
        <div className="absolute inset-0">
          <AlbumGridView versions={orbVersions} albumPalette={album.palette} />
        </div>
      ),
    })
  }, [album.palette, orbVersions])

  const originalVersion: ExtendedVersion | null = useMemo(() => {
    return allVersions.find((v) => v.is_original) ?? null
  }, [allVersions])

  const showOriginalInfo = !!originalVersion && allVersions.length >= 2

  // Inject album palette into CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--album-dominant', palette.dominant)
    document.documentElement.style.setProperty('--album-accent1', palette.accent1)
    document.documentElement.style.setProperty('--album-accent2', palette.accent2)

    return () => {
      // Reset to defaults on unmount
      document.documentElement.style.setProperty('--album-dominant', '#090B0D')
      document.documentElement.style.setProperty('--album-accent1', '#4F9EFF')
      document.documentElement.style.setProperty('--album-accent2', '#FF6B4A')
    }
  }, [palette])

  return (
    <div
      className="min-h-screen bg-background pb-[calc(7rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundImage: `radial-gradient(circle at top, ${hexWithOpacity(palette.dominant, 0.08)} 0%, transparent 40%),
          radial-gradient(circle at bottom right, ${hexWithOpacity(palette.accent1, 0.06)} 0%, transparent 35%)`,
      }}
    >
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-void/90 backdrop-blur-md border-b border-bone/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-bone/10 transition-colors"
            aria-label="Back"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-bone" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-bone truncate">{album.title}</h1>
            <p className="text-sm text-bone/60">
              {orbVersions.length} {orbVersions.length === 1 ? 'version' : 'versions'}
            </p>
          </div>
        </div>
      </header>

      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-4">
            {showOriginalInfo && originalVersion && (
              <OriginalTrackInfo
                albumSlug={album.slug}
                original={originalVersion}
                albumPalette={album.palette}
              />
            )}
          </div>

          {allVersions.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-bone/50 text-lg">No versions available yet</p>
            </div>
          ) : (
            <div className="relative w-full h-[60vh] md:h-[600px] min-h-[400px] max-h-[800px]">
              <VersionOrbField3D
                versions={orbVersions}
                albumCoverUrl={album.cover_url || ''}
                albumPalette={album.palette}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>
      </div>

      <SpectrumAnalyzer />
    </div>
  )
}
