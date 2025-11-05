'use client'

import { RigidBody, CuboidCollider } from '@react-three/rapier'

interface InvisibleBoundsProps {
  size?: number
}

/**
 * Invisible physics boundaries to keep orbs in view
 * Creates walls on all sides to prevent orbs from flying away
 */
export function InvisibleBounds({ size = 20 }: InvisibleBoundsProps) {
  return (
    <>
      {/* Top wall */}
      <CuboidCollider 
        position={[0, size, 0]} 
        args={[size * 2, 0.5, 10]} 
      />
      
      {/* Bottom wall */}
      <CuboidCollider 
        position={[0, -size, 0]} 
        args={[size * 2, 0.5, 10]} 
      />
      
      {/* Left wall */}
      <CuboidCollider 
        position={[-size, 0, 0]} 
        args={[0.5, size * 2, 10]} 
      />
      
      {/* Right wall */}
      <CuboidCollider 
        position={[size, 0, 0]} 
        args={[0.5, size * 2, 10]} 
      />
      
      {/* Back wall (prevent orbs from going too far back) */}
      <CuboidCollider 
        position={[0, 0, -5]} 
        args={[size * 2, size * 2, 0.5]} 
      />
    </>
  )
}
