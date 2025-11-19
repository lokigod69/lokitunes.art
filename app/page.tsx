'use client'

import { useEffect, useState } from 'react'
import { Logo3D } from '@/components/Logo3D'
import { OrbField, OrbFieldFallback } from '@/components/OrbField'
import { ScanlineEffect } from '@/components/ScanlineEffect'
import { RatingProgressBadge } from '@/components/RatingProgressBadge'
import { OnboardingModal } from '@/components/OnboardingModal'
import { TutorialButton } from '@/components/TutorialButton'
import { OrbitModeToggle } from '@/components/OrbitModeToggle'
import { useOnboarding } from '@/hooks/useOnboarding'
import { getAlbumsWithVersionCounts } from '@/lib/queries'
import type { Album } from '@/lib/supabase'

export default function Home() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  const [is3D, setIs3D] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { shouldShow, hasLoaded, language, setLanguage, dismiss, show } = useOnboarding()

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    // Check for WebGL support
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    setHasWebGL(!!gl)

    const checkIsMobile = () => window.innerWidth < 768
    setIsMobile(checkIsMobile())
    const handleResize = () => setIsMobile(checkIsMobile())
    window.addEventListener('resize', handleResize)

    // Fetch albums
    getAlbumsWithVersionCounts().then((data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Home albums fetched:', data.length)
      }
      setAlbums(data)
      setLoading(false)
    })

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lokitunes-orbit-mode')
      if (stored === '3d') {
        setIs3D(true)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Home is3D state changed:', is3D)
    }
  }, [is3D])

  const baseFallback = prefersReducedMotion || !hasWebGL
  const shouldUseFallback = baseFallback || (isMobile && !is3D)

  if (process.env.NODE_ENV === 'development') {
    console.log('Home orbit state', {
      isMobile,
      is3D,
      prefersReducedMotion,
      hasWebGL,
      baseFallback,
      shouldUseFallback,
    })
  }

  const rootClassName = shouldUseFallback
    ? 'relative w-full min-h-screen bg-void overflow-y-auto'
    : 'relative w-full h-screen bg-void overflow-hidden'

  return (
    <div className={rootClassName}>
      {isMobile && (
        <OrbitModeToggle
          is3D={is3D}
          onToggle={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Orbit toggle clicked', { previous: is3D, next: !is3D })
            }
            const next = !is3D
            setIs3D(next)
            try {
              localStorage.setItem('lokitunes-orbit-mode', next ? '3d' : '2d')
            } catch {
              // ignore storage errors
            }
          }}
        />
      )}

      {hasLoaded && (
        <>
          <OnboardingModal
            isOpen={shouldShow}
            language={language}
            onLanguageChange={setLanguage}
            onDismiss={dismiss}
          />
          <TutorialButton onClick={show} />
        </>
      )}

      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-bone/50 text-lg">Loading sonic landscape...</div>
        </div>
      ) : shouldUseFallback ? (
        <>
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-20 left-4 z-[9999] bg-red-500 text-white text-xs px-3 py-2 rounded shadow">
              <div>isMobile: {String(isMobile)}</div>
              <div>is3D: {String(is3D)}</div>
              <div>albums: {albums.length}</div>
              <div>fallback: {String(shouldUseFallback)}</div>
            </div>
          )}

          {/* Logo */}
          <Logo3D />
          <div className="fixed top-6 left-6 z-40 pointer-events-none">
            <RatingProgressBadge />
          </div>
          <main className="container mx-auto px-4 pb-32 md:pb-24">
            <OrbFieldFallback key="2d-mode" albums={albums} />
          </main>
        </>
      ) : (
        <>
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-20 left-4 z-[9999] bg-green-600 text-white text-xs px-3 py-2 rounded shadow">
              <div>isMobile: {String(isMobile)}</div>
              <div>is3D: {String(is3D)}</div>
              <div>albums: {albums.length}</div>
              <div>fallback: {String(shouldUseFallback)}</div>
            </div>
          )}

          {/* Fullscreen 3D Canvas - Background layer (z-0) */}
          <div className="fixed inset-0 w-full h-full z-0">
            <OrbField key="3d-mode" albums={albums} />
          </div>

          <div className="fixed top-6 left-6 z-40 pointer-events-none">
            <RatingProgressBadge />
          </div>
          
          {/* Header - Now 3D in Canvas (NeonHeader component) */}
          {/* <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <Logo3D />
          </div> */}
          
          {/* Scanline CRT Effect */}
          <ScanlineEffect />
        </>
      )}
    </div>
  )
}
