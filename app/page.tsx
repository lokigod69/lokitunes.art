'use client'

import { useEffect, useState } from 'react'
import { Logo3D } from '@/components/Logo3D'
import { OrbField, OrbFieldFallback } from '@/components/OrbField'
import { ScanlineEffect } from '@/components/ScanlineEffect'
import { RatingProgressBadge } from '@/components/RatingProgressBadge'
import { OnboardingModal } from '@/components/OnboardingModal'
import { TutorialButton } from '@/components/TutorialButton'
import { useOnboarding } from '@/hooks/useOnboarding'
import { getAlbumsWithVersionCounts } from '@/lib/queries'
import type { Album } from '@/lib/supabase'

export default function Home() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)

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
      setAlbums(data)
      setLoading(false)
    })

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const shouldUseFallback = prefersReducedMotion || !hasWebGL

  return (
    <div className="relative w-full h-screen bg-void overflow-hidden">
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
          {/* Logo */}
          <Logo3D />
          <div className="fixed top-6 left-6 z-40 pointer-events-none">
            <RatingProgressBadge />
          </div>
          <main className="container mx-auto px-4">
            <OrbFieldFallback albums={albums} />
          </main>
        </>
      ) : (
        <>
          {/* Fullscreen 3D Canvas - Background layer (z-0) */}
          <div className="fixed inset-0 w-full h-full z-0">
            <OrbField albums={albums} />
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
