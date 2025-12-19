/**
 * Obstacle Field
 * Spawns and manages the rainbow obstacle spheres for Orb Defense mode
 */
'use client'

import { useMemo } from 'react'
import { GameObstacle } from './GameObstacle'
import { usePlayMode } from '@/hooks/usePlayMode'

const OBSTACLE_COUNT = 8

export function ObstacleField() {
  const { isActive } = usePlayMode()
  
  const obstacles = useMemo(() => {
    return Array.from({ length: OBSTACLE_COUNT }, (_, i) => ({
      id: `obstacle-${i}`,
      position: [
        (Math.random() - 0.5) * 30,     // X spread
        (Math.random() - 0.5) * 12,     // Y spread  
        -25 - i * 5 - Math.random() * 10 // Z: staggered starting positions
      ] as [number, number, number],
      size: 1.2 + Math.random() * 1.0,  // Random size 1.2-2.2
      hueOffset: i / OBSTACLE_COUNT     // Distribute hues evenly
    }))
  }, [])
  
  if (!isActive) return null
  
  return (
    <>
      {obstacles.map(obs => (
        <GameObstacle
          key={obs.id}
          id={obs.id}
          initialPosition={obs.position}
          size={obs.size}
          hueOffset={obs.hueOffset}
        />
      ))}
    </>
  )
}
