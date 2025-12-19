'use client'

import { HelpCircle } from 'lucide-react'

interface TutorialButtonProps {
  onClick: () => void
}

export function TutorialButton({ onClick }: TutorialButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 rounded-lg bg-black/80 border border-bone/30 hover:border-bone/60 transition-all backdrop-blur flex items-center justify-center group"
      aria-label="Show tutorial"
    >
      <HelpCircle className="w-4 h-4 text-bone" />
      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/90 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Show tutorial
      </span>
    </button>
  )
}
