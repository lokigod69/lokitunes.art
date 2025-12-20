'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Logo3D } from '@/components/Logo3D'
import { OrbFieldFallback } from '@/components/OrbFieldFallback'
import { HeaderScanline } from '@/components/HeaderScanline'
import { RatingProgressBadge } from '@/components/RatingProgressBadge'
import { OnboardingModal } from '@/components/OnboardingModal'
import { loadOrbitModePreference } from '@/components/OrbitModeToggle'
import { UnifiedMenu } from '@/components/UnifiedMenu'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useOrbRepulsion } from '@/hooks/useOrbRepulsion'
import { useStyleStore } from '@/hooks/useStyle'
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

  const style = useStyleStore((s) => s.style)
  const setStyle = useStyleStore((s) => s.setStyle)

  const repulsionStrength = useOrbRepulsion((s) => s.repulsionStrength)
  const setRepulsionStrength = useOrbRepulsion((s) => s.setRepulsionStrength)

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

  const OrbField3D = useMemo(() => {
    return dynamic(() => import('@/components/OrbField').then((m) => m.OrbField), {
      ssr: false,
      loading: () => (
        <div className="w-full h-full overflow-y-auto">
          <OrbFieldFallback albums={albums} />
        </div>
      ),
    })
  }, [albums])

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
      <UnifiedMenu
        is3D={is3D}
        onToggle3D={() => handleOrbitToggle(!is3D)}
        showViewToggle={isMobile}
        currentStyle={style}
        onStyleChange={setStyle}
        onOpenTutorial={show}
        showPlayMode={true}
        repelStrength={Math.round(repulsionStrength * 100)}
        onRepelChange={(value) => setRepulsionStrength(value / 100)}
      />


      {hasLoaded && (
        <>
          <OnboardingModal
            isOpen={shouldShow}
            language={language}
            onLanguageChange={setLanguage}
            onDismiss={dismiss}
          />
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

          <Logo3D />

          {!isMobile && (
            <div className="fixed top-16 left-4 z-40 pointer-events-none">
              <RatingProgressBadge />
            </div>
          )}
          <main className="container mx-auto px-4 pb-32 md:pb-24">
            <OrbFieldFallback key="2d-mode" albums={albums} />
          </main>
        </>
      ) : (
        <>

          {/* Fullscreen 3D Canvas - Background layer (z-0) */}
          <div className="fixed inset-0 w-full h-full z-0">
            <OrbField3D key="3d-mode" albums={albums} isMobile={isMobile} />
          </div>

          {!isMobile && (
            <div className="fixed top-16 left-4 z-40 pointer-events-none">
              <RatingProgressBadge />
            </div>
          )}
          
          {/* Header - Now 3D in Canvas (NeonHeader component) */}
          {/* <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <Logo3D />
          </div> */}
          
          {/* Header Scanline Effect - only on desktop (clutters mobile) */}
          {!isMobile && <HeaderScanline />}
        </>
      )}
    </div>
  )
}
