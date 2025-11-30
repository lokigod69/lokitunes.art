'use client'

import { useEffect, useState } from 'react'
import { Logo3D } from '@/components/Logo3D'
import { OrbField, OrbFieldFallback } from '@/components/OrbField'
import { HeaderScanline } from '@/components/HeaderScanline'
import { RatingProgressBadge } from '@/components/RatingProgressBadge'
import { OnboardingModal } from '@/components/OnboardingModal'
import { TutorialButton } from '@/components/TutorialButton'
import { OrbitModeToggle, loadOrbitModePreference } from '@/components/OrbitModeToggle'
import { useOnboarding } from '@/hooks/useOnboarding'
import { getAlbumsWithVersionCounts } from '@/lib/queries'
import type { Album } from '@/lib/supabase'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import { safeLocalStorage } from '@/lib/safeLocalStorage'

export default function Home() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  const [is3D, setIs3D] = useState(() => {
    if (typeof window === 'undefined') return false
    return loadOrbitModePreference()
  })

  const isMobile = useMobileDetection(768)

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
    }
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

  const handleOrbitToggle = (nextIs3D: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Orbit toggle clicked', { previous: is3D, next: nextIs3D })
    }

    setIs3D(nextIs3D)

    try {
      safeLocalStorage.setItem('lokitunes-orbit-mode', nextIs3D ? '3d' : '2d')
    } catch {
      // ignore storage errors
    }
  }

  const rootClassName = shouldUseFallback
    ? 'relative w-full min-h-screen bg-void overflow-y-auto'
    : 'relative w-full h-screen bg-void overflow-hidden'

  return (
    <div className={rootClassName}>
      {isMobile && (
        <OrbitModeToggle
          is3D={is3D}
          onToggle={handleOrbitToggle}
        />
      )}

      {true && (  // TEMPORARY: Always show debug panel
        <div className="fixed top-20 right-4 z-50 p-3 bg-black/80 backdrop-blur border border-zinc-700 rounded text-xs space-y-1 max-w-[200px]">
          <div className="text-[var(--voltage)] font-bold">Debug Info:</div>
          <div>Mobile: {isMobile ? 'YES' : 'NO'}</div>
          <div>3D Mode: {is3D ? 'YES' : 'NO'}</div>
          <div>Fallback: {shouldUseFallback ? 'YES' : 'NO'}</div>
          <div>ReducedMotion: {prefersReducedMotion ? 'YES' : 'NO'}</div>
          <div>HasWebGL: {hasWebGL ? 'YES' : 'NO'}</div>
          <div>Width: {typeof window !== 'undefined' ? window.innerWidth : 'SSR'}</div>
          <div>Albums: {albums.length}</div>
        </div>
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
            <OrbField key="3d-mode" albums={albums} isMobile={isMobile} />
          </div>

          <div className="fixed top-6 left-6 z-40 pointer-events-none">
            <RatingProgressBadge />
          </div>
          
          {/* Header - Now 3D in Canvas (NeonHeader component) */}
          {/* <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <Logo3D />
          </div> */}
          
          {/* Header Scanline Effect - localized to header area only */}
          <HeaderScanline />
        </>
      )}
    </div>
  )
}
