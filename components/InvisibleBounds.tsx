'use client'

import { RigidBody, CuboidCollider } from '@react-three/rapier'

interface InvisibleBoundsProps {
  size?: number
}

/**
 * Invisible physics boundaries to keep orbs in view
 * Creates walls on all sides to prevent orbs from flying away
 */
export function InvisibleBounds({ size = 25 }: InvisibleBoundsProps) {
  return (
    <>
      {/* Top wall - Higher to allow orbs to reach near vinyl area */}
      <RigidBody type="fixed" position={[0, 8, 0]}>
        <CuboidCollider args={[size, 0.5, 30]} />
      </RigidBody>

      {/* Bottom wall - Match container edge */}
      <RigidBody type="fixed" position={[0, -13, 0]}>
        <CuboidCollider args={[size, 0.5, 30]} />
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed" position={[-20, 0, 0]}>
        <CuboidCollider args={[0.5, size, 30]} />
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" position={[20, 0, 0]}>
        <CuboidCollider args={[0.5, size, 30]} />
      </RigidBody>
      
      {/* Front wall - keep orbs from going too far forward */}
      <RigidBody type="fixed" position={[0, 0, 5]}>
        <CuboidCollider args={[size, size, 0.5]} />
      </RigidBody>
      
      {/* Back wall - keep orbs from going too far back */}
      <RigidBody type="fixed" position={[0, 0, -50]}>
        <CuboidCollider args={[size, size, 0.5]} />
      </RigidBody>
    </>
  )
}
