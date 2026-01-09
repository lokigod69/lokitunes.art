'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Pause, Play, Shuffle } from 'lucide-react'
import { AlbumGridView } from '@/components/AlbumGridView'
import { OriginalTrackInfo } from '@/components/OriginalTrackInfo'
import { SpectrumAnalyzer } from '@/components/SpectrumAnalyzer'
import { VersionQuickPlayList } from '@/components/VersionQuickPlayList'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import type { ExtendedVersion } from '@/components/VersionOrb'
import type { AlbumWithSongs } from '@/lib/supabase'
import { devLog } from '@/lib/debug'
import { useAudioStore } from '@/lib/audio-store'

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

  const { currentVersion, isPlaying, playStandalone, pause, play, startAlbumQueue, setAutoplayMode, startGlobalQueue, autoplayMode } = useAudioStore()

  // Handle version click from quick-play list - same as orb click behavior
  const handleVersionClick = (version: ExtendedVersion) => {
    if (currentVersion?.id === version.id) {
      // Same version - toggle play/pause
      if (isPlaying) {
        pause()
      } else {
        play(version, version.songId, palette)
      }
    } else {
      // Different version - start playing based on autoplay mode
      if (autoplayMode === 'all') {
        startGlobalQueue(version, palette)
      } else if (autoplayMode === 'album') {
        startAlbumQueue(orbVersions, version.id, palette)
      } else {
        play(version, version.songId, palette, true)
      }
    }
  }

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
        <div className="absolute inset-0 bg-void" />
      ),
    })
  }, [album.palette, orbVersions])

  const originalVersion: ExtendedVersion | null = useMemo(() => {
    return allVersions.find((v) => v.is_original) ?? null
  }, [allVersions])

  const showOriginalInfo = !!originalVersion && allVersions.length >= 2

  const isDemoActive = !!originalVersion && currentVersion?.id === originalVersion.id
  const isDemoPlaying = isDemoActive && isPlaying

  // Check if currently playing something from this album
  const isAlbumPlaying = orbVersions.some(v => v.id === currentVersion?.id) && isPlaying

  // Play All shuffle - picks random track from THIS album, then sets autoplay to 'all' (infinity shuffle)
  const handlePlayAllShuffle = () => {
    if (orbVersions.length === 0) return
    
    if (isAlbumPlaying) {
      pause()
      return
    }
    
    // Pick a random starting track from this album
    const randomIndex = Math.floor(Math.random() * orbVersions.length)
    const startVersion = orbVersions[randomIndex]
    
    setAutoplayMode('album')
    startAlbumQueue(orbVersions, startVersion.id, palette)
  }

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
      <div className="fixed top-4 left-4 z-40">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-void/80 backdrop-blur-md border border-bone/10 hover:border-bone/30 transition-colors cursor-pointer"
          aria-label="Back"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 text-bone" />
          <span className="text-bone text-sm">Back</span>
        </Link>
      </div>

      <header
        className="relative pt-20 pb-8 px-4 md:px-8"
        style={{
          background: `linear-gradient(to bottom, ${hexWithOpacity(palette.dominant, 0.25)} 0%, transparent 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-6">
          {/* LEFT SIDE: Cover + Info */}
          <div className="flex items-start gap-4 md:gap-6 flex-1 min-w-0">
          <div className="w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 border border-bone/10">
            {album.cover_url ? (
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: palette.accent1 || '#333' }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-bone mb-2 truncate">{album.title}</h1>
            <div className="flex items-center gap-2 text-bone/60">
              <span>
                {orbVersions.length} {orbVersions.length === 1 ? 'version' : 'versions'}
              </span>

              {showOriginalInfo && originalVersion && (
                <OriginalTrackInfo
                  albumSlug={album.slug}
                  original={originalVersion}
                  albumPalette={album.palette}
                />
              )}
            </div>

            {orbVersions.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handlePlayAllShuffle}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-bone/10 hover:border-[var(--album-accent1)] transition-colors text-bone/80 hover:text-bone cursor-pointer"
                  title="Shuffle play all versions"
                >
                  {isAlbumPlaying ? (
                    <Pause className="w-4 h-4" fill="currentColor" />
                  ) : (
                    <Shuffle className="w-4 h-4" />
                  )}
                  <span>{isAlbumPlaying ? 'Pause' : 'Play All'}</span>
                </button>
              </div>
            )}
          </div>
          </div>

          {/* RIGHT SIDE: Version Quick-Play List */}
          {orbVersions.length > 0 && (
            <div className="w-full md:w-[420px] md:flex-shrink-0 md:mr-8">
              <VersionQuickPlayList
                versions={orbVersions}
                currentVersionId={currentVersion?.id}
                isPlaying={isPlaying}
                onVersionClick={handleVersionClick}
                accentColor={palette.accent1}
                albumCoverUrl={album.cover_url || undefined}
              />
            </div>
          )}
        </div>
      </header>

      <div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">

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
