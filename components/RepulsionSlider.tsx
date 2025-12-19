'use client'

/**
 * RepulsionSlider - Controls orb-to-orb repulsion strength
 * When maxed, orbs maintain distance like atoms in a grid
 */
import { useOrbRepulsion } from '@/hooks/useOrbRepulsion'

interface RepulsionSliderProps {
  className?: string
}

export function RepulsionSlider({ className = '' }: RepulsionSliderProps) {
  const { repulsionStrength, setRepulsionStrength } = useOrbRepulsion()
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-cyan-400 text-xs font-mono opacity-70">REPEL</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={repulsionStrength}
        onChange={(e) => setRepulsionStrength(parseFloat(e.target.value))}
        className="w-20 h-1 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,255,255,0.8)]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-cyan-400
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
        title={`Repulsion: ${Math.round(repulsionStrength * 100)}%`}
      />
    </div>
  )
}
