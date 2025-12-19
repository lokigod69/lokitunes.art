'use client'

import { useEffect, useState } from 'react'
import { Circle, Palette } from 'lucide-react'

type MonochromeMode = 'normal' | 'cyan' | 'pastel' | 'green'

interface MonochromeToggleProps {
  className?: string
}

export default function MonochromeToggle({ className }: MonochromeToggleProps) {
  const [mode, setMode] = useState<MonochromeMode>(() => {
    if (typeof window === 'undefined') return 'normal'
    const stored = localStorage.getItem('monochrome-mode') as MonochromeMode | null
    return stored || 'normal'
  })

  const cycleMode = () => {
    const modes: MonochromeMode[] = ['normal', 'cyan', 'pastel', 'green']
    const currentIndex = modes.indexOf(mode)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.classList.remove('monochrome-cyan', 'monochrome-pastel', 'monochrome-green')

    if (mode !== 'normal') {
      root.classList.add(`monochrome-${mode}`)
    }

    try {
      localStorage.setItem('monochrome-mode', mode)
    } catch {
      // ignore storage errors
    }
  }, [mode])

  const getLabel = () => {
    switch (mode) {
      case 'normal':
        return 'Color Mode'
      case 'cyan':
        return 'Cyan Monochrome'
      case 'pastel':
        return 'Soft Monochrome'
      case 'green':
        return 'Terminal Mode'
    }
  }

  const isColor = mode === 'normal'

  return (
    <button
      type="button"
      onClick={cycleMode}
      className={className || "fixed top-4 right-4 z-50 p-3 rounded-lg bg-black/80 border border-cyan-500/30 hover:border-cyan-500 transition-all backdrop-blur flex items-center justify-center group"}
      title={`Current: ${getLabel()}. Click to cycle.`}
    >
      {isColor ? (
        <Palette className="w-5 h-5 text-cyan-500" />
      ) : (
        <Circle className="w-5 h-5 text-white" />
      )}

      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/90 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {getLabel()}
      </span>
    </button>
  )
}
