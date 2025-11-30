'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * Localized scanline effect for the header area only.
 * Features randomized direction and speed for a dynamic CRT aesthetic.
 */

type Direction = 'top' | 'bottom' | 'left' | 'right'

const DIRECTIONS: Direction[] = ['top', 'bottom', 'left', 'right']

function getRandomDirection(): Direction {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
}

function getRandomDuration(): number {
  // Random duration between 2s and 8s
  return 2 + Math.random() * 6
}

export function HeaderScanline() {
  const [direction, setDirection] = useState<Direction>('top')
  const [duration, setDuration] = useState(4)
  const [animationKey, setAnimationKey] = useState(0)

  // Initialize with random values
  useEffect(() => {
    setDirection(getRandomDirection())
    setDuration(getRandomDuration())
  }, [])

  // Randomize on animation cycle completion
  const handleAnimationEnd = useCallback(() => {
    setDirection(getRandomDirection())
    setDuration(getRandomDuration())
    setAnimationKey(prev => prev + 1)
  }, [])

  // Build the gradient based on direction
  const getGradient = () => {
    const isVertical = direction === 'top' || direction === 'bottom'
    const angle = isVertical ? '0deg' : '90deg'
    
    return `
      repeating-linear-gradient(
        ${angle},
        rgba(0, 0, 0, 0) 0px,
        rgba(0, 0, 0, 0.4) 1px,
        rgba(0, 0, 0, 0) 2px,
        rgba(0, 0, 0, 0) 4px
      )
    `
  }

  // Build the animation based on direction
  const getAnimationName = () => {
    switch (direction) {
      case 'top': return 'scanlineDown'
      case 'bottom': return 'scanlineUp'
      case 'left': return 'scanlineRight'
      case 'right': return 'scanlineLeft'
    }
  }

  return (
    <>
      {/* Scanline overlay - only covers header area */}
      <div
        key={animationKey}
        className="fixed top-0 left-0 right-0 pointer-events-none z-50 overflow-hidden"
        style={{
          height: '120px',
          background: getGradient(),
          animation: `${getAnimationName()} ${duration}s linear`,
        }}
        onAnimationEnd={handleAnimationEnd}
      />

      <style jsx>{`
        @keyframes scanlineDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes scanlineUp {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        
        @keyframes scanlineRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes scanlineLeft {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  )
}
