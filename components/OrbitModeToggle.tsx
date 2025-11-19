'use client'

// Floating toggle button to switch between 2D grid and 3D orb modes on mobile home page.

import { Circle, Grid3x3 } from 'lucide-react'

interface OrbitModeToggleProps {
  is3D: boolean
  onToggle: () => void
}

export function OrbitModeToggle({ is3D, onToggle }: OrbitModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed top-4 right-24 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-void/80 backdrop-blur-sm transition-colors hover:bg-void md:hidden"
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
