'use client'

/**
 * Applies the persisted style from useStyleStore to the document root.
 */

import { useEffect } from 'react'
import { useStyleStore } from '@/hooks/useStyle'

const STYLE_CLASSES = ['monochrome-cyan', 'monochrome-pastel', 'monochrome-green']

const STYLE_TO_CLASS: Record<string, string | null> = {
  color: null,
  chrome: 'monochrome-pastel',
  monochrome: 'monochrome-cyan',
}

export function StyleManager() {
  const style = useStyleStore((s) => s.style)
  const setStyle = useStyleStore((s) => s.setStyle)

  useEffect(() => {
    const stored = window.localStorage.getItem('lokitunes-style')
    if (stored) return

    const legacy = window.localStorage.getItem('monochrome-mode')
    if (!legacy) return

    if (legacy === 'normal') setStyle('color')
    else if (legacy === 'pastel') setStyle('chrome')
    else setStyle('monochrome')
  }, [setStyle])

  useEffect(() => {
    const root = document.documentElement

    root.classList.remove(...STYLE_CLASSES)

    const className = STYLE_TO_CLASS[style]
    if (className) {
      root.classList.add(className)
    }
  }, [style])

  return null
}
