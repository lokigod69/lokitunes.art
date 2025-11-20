'use client'

// Floating toggle button to switch between 2D grid and 3D orb modes on mobile home page.
import { useEffect, useState } from 'react'
import { Circle, Grid3x3 } from 'lucide-react'
import { safeLocalStorage } from '@/lib/safeLocalStorage'

interface OrbitModeToggleProps {
  is3D: boolean
  onToggle: (is3D: boolean) => void
}

const STORAGE_KEY = 'lokitunes-orbit-mode'

export function OrbitModeToggle({ is3D, onToggle }: OrbitModeToggleProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (process.env.NODE_ENV === 'development') {
      console.log('[OrbitModeToggle] Mounted:', {
        is3D,
        storedValue: safeLocalStorage.getItem(STORAGE_KEY),
      })
    }
  }, [is3D])

  const handleToggle = () => {
    const newValue = !is3D

    safeLocalStorage.setItem(STORAGE_KEY, newValue ? '3d' : '2d')
    onToggle(newValue)

    if (process.env.NODE_ENV === 'development') {
      console.log('[OrbitModeToggle] Toggled:', {
        from: is3D ? '3D' : '2D',
        to: newValue ? '3D' : '2D',
      })
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="fixed top-4 right-24 z-[9999] flex h-10 w-10 items-center justify-center rounded-lg bg-void/80 backdrop-blur-sm transition-colors hover:bg-void md:hidden"
      aria-label={is3D ? 'Switch to 2D grid' : 'Switch to 3D orbs'}
      title={is3D ? 'Switch to 2D Grid' : 'Switch to 3D Orbs'}
    >
      {is3D ? (
        <Grid3x3 className="w-4 h-4 text-bone" />
      ) : (
        <Circle className="w-4 h-4 text-bone" />
      )}
    </button>
  )
}

export function loadOrbitModePreference(): boolean {
  const stored = safeLocalStorage.getItem(STORAGE_KEY)
  const default3D = false

  if (!stored) return default3D

  return stored === '3d'
}
