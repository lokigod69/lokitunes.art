'use client'

// Floating toggle button to switch between 2D grid and 3D orb modes on mobile home page.

import { Circle, Grid3x3 } from 'lucide-react'

interface OrbitModeToggleProps {
  use3D: boolean
  onToggle: () => void
}

export function OrbitModeToggle({ use3D, onToggle }: OrbitModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed top-4 right-28 z-50 p-2 rounded-lg bg-black/80 border border-bone/30 hover:border-bone/60 transition-all backdrop-blur flex items-center justify-center group md:hidden"
      aria-label={use3D ? 'Switch to 2D grid' : 'Switch to 3D orbs'}
      title={use3D ? 'Switch to 2D Grid' : 'Switch to 3D Orbs'}
    >
      {use3D ? (
        <Grid3x3 className="w-4 h-4 text-bone" />
      ) : (
        <Circle className="w-4 h-4 text-bone" />
      )}
    </button>
  )
}
