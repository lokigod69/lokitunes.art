/**
 * BurstManager - Renders and manages all active burst effects
 */
'use client'

import { OrbBurst } from './OrbBurst'

interface Burst {
  id: string
  position: [number, number, number]
  colors: string[]
}

interface BurstManagerProps {
  bursts: Burst[]
  onBurstComplete: (id: string) => void
}

export function BurstManager({ bursts, onBurstComplete }: BurstManagerProps) {
  return (
    <>
      {bursts.map(burst => (
        <OrbBurst
          key={burst.id}
          position={burst.position}
          colors={burst.colors}
          onComplete={() => onBurstComplete(burst.id)}
        />
      ))}
    </>
  )
}
