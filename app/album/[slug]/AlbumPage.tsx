'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SongRow } from '@/components/SongRow'
import { VersionOrbField } from '@/components/VersionOrbField'
import { OriginalTrackInfo } from '@/components/OriginalTrackInfo'
import type { ExtendedVersion } from '@/components/VersionOrb'
import type { AlbumWithSongs } from '@/lib/supabase'

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
  // 🔥🔥🔥 DEBUG: Log exact palette received on CLIENT
  console.log('🔥🔥🔥 CLIENT (AlbumPage): Received album:', album.slug, {
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
  console.log('🔥 CLIENT (AlbumPage): Using palette:', palette)

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
    console.log(`🎵 Album "${album.title}": ${versions.length} versions found`)
    versions.forEach((v, i) => console.log(`  Version ${i + 1}: ${v.label}`))
    
    return versions
  }, [album])

  const orbVersions: ExtendedVersion[] = useMemo(() => {
    const nonOriginal = allVersions.filter((v) => !v.is_original)
    return nonOriginal.length > 0 ? nonOriginal : allVersions
  }, [allVersions])

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
      className="min-h-screen bg-background pb-20"
      style={{
        backgroundImage: `radial-gradient(circle at top, ${hexWithOpacity(palette.dominant, 0.08)} 0%, transparent 40%),
          radial-gradient(circle at bottom right, ${hexWithOpacity(palette.accent1, 0.06)} 0%, transparent 35%)`,
      }}
    >
      {/* Header with album art and title */}
      <div
        className="relative w-full"
        style={{
          background: `linear-gradient(to bottom, ${hexWithOpacity(palette.dominant, 0.2)} 0%, ${hexWithOpacity(palette.dominant, 0.14)} 35%, transparent 80%), linear-gradient(to bottom, ${hexWithOpacity(palette.accent1, 0.12)} 0%, transparent 100%)`,
          boxShadow: `0 32px 80px ${hexWithOpacity(palette.accent1, 0.18)}`,
          borderBottom: `1px solid ${hexWithOpacity(palette.accent1, 0.25)}`,
        }}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Link
            href="/"
            className="album-back-link inline-flex items-center gap-2 text-bone/70 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to orb field</span>
          </Link>

          {/* Album header */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Album cover */}
            {album.cover_url && (
              <div className="w-full md:w-64 aspect-square rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Album info */}
            <div className="flex-1">
              <h1
                className="text-4xl md:text-6xl font-bold mb-4"
                style={{ color: palette.accent1 }}
              >
                {album.title}
              </h1>
              {/* NOTE: Backend supports multiple songs per album, but the UI treats each album as a single song concept and only surfaces total version count for clarity. */}
              <div className="flex items-center gap-2">
                <p className="text-bone/70 text-lg">
                  {orbVersions.length} {orbVersions.length === 1 ? 'version' : 'versions'}
                </p>
                {showOriginalInfo && originalVersion && (
                  <OriginalTrackInfo
                    albumSlug={album.slug}
                    original={originalVersion}
                    albumPalette={album.palette}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Version Orb Field */}
      <div className="container mx-auto px-4 py-8">
        <div className="relative w-full" style={{ height: '600px', minHeight: '500px' }}>
          {allVersions.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-bone/50 text-lg">No versions available yet</p>
            </div>
          ) : (
            <VersionOrbField 
              versions={orbVersions}
              albumCoverUrl={album.cover_url || ''}
              albumPalette={album.palette}
            />
          )}
        </div>
      </div>
    </div>
  )
}
