import { useEffect, useState } from 'react'

/**
 * Mobile detection hook using matchMedia API.
 *
 * More reliable on iOS Safari than window.innerWidth because it:
 * - Handles address bar showing/hiding correctly
 * - Works better with iOS viewport behavior
 * - Uses the native responsive media query API
 */
export function useMobileDetection(breakpoint: number = 768) {
  // Initialize with false to prevent hydration mismatches.
  // Will update to the correct value after mount.
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      setMounted(true)
      return
    }

    setMounted(true)

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)

    // Set initial value
    setIsMobile(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)

      if (process.env.NODE_ENV === 'development') {
        console.log('[useMobileDetection] Viewport changed:', {
          isMobile: e.matches,
          width: window.innerWidth,
          breakpoint,
        })
      }
    }

    try {
      mediaQuery.addEventListener('change', handleChange)
    } catch {
      // Fallback for older browsers / Safari versions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(mediaQuery as any).addListener(handleChange)
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange)
      } catch {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mediaQuery as any).removeListener(handleChange)
      }
    }
  }, [breakpoint])

  // Return false during SSR and initial mount to prevent hydration issues
  return mounted ? isMobile : false
}

/**
 * Alternative: simple hook that checks once on mount.
 * Use this if you don't need live resize detection.
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return
    }

    const checkMobile = () => {
      const mobile = window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
      setIsMobile(mobile)

      if (process.env.NODE_ENV === 'development') {
        console.log('[useIsMobile] Detected:', {
          mobile,
          width: window.innerWidth,
          breakpoint,
        })
      }
    }

    checkMobile()
  }, [breakpoint])

  return isMobile
}
