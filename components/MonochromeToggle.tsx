'use client'

import { useEffect, useState } from 'react'
import { Circle, Palette } from 'lucide-react'

export default function MonochromeToggle() {
  const [isMonochrome, setIsMonochrome] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('monochrome-mode') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    if (isMonochrome) {
      root.classList.add('monochrome')
    } else {
      root.classList.remove('monochrome')
    }

    try {
      localStorage.setItem('monochrome-mode', isMonochrome.toString())
    } catch {
      // ignore storage errors
    }
  }, [isMonochrome])

  return (
    <button
      type="button"
      onClick={() => setIsMonochrome((prev) => !prev)}
      className="fixed top-4 right-4 z-50 p-3 rounded-lg bg-black/80 border border-cyan-500/30 hover:border-cyan-500 transition-all backdrop-blur flex items-center justify-center"
      title={isMonochrome ? 'Switch to Color Mode' : 'Switch to Monochrome Mode'}
    >
      {isMonochrome ? (
        <Palette className="w-5 h-5 text-white" />
      ) : (
        <Circle className="w-5 h-5 text-cyan-400" />
      )}
    </button>
  )
}
