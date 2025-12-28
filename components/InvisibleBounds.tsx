'use client'

import { RigidBody, CuboidCollider } from '@react-three/rapier'

interface InvisibleBoundsProps {
  size?: number
  isPlaying?: boolean  // When true, adds stricter front barrier to keep orbs behind vinyl
  topY?: number
  topYPlaying?: number
  depth?: number
}

/**
 * Invisible physics boundaries to keep orbs in view
 * Creates walls on all sides to prevent orbs from flying away
 */
// Z position constants for front barrier
// When playing: orbs must stay behind this Z to not block vinyl
const FRONT_BARRIER_PLAYING_Z = -5  // Stricter when vinyl is visible
const FRONT_BARRIER_DEFAULT_Z = 5   // Normal bounds when not playing

export function InvisibleBounds({
  size = 25,
  isPlaying = false,
  topY,
  topYPlaying,
  depth = 30,
}: InvisibleBoundsProps) {
  // Front barrier Z position depends on whether vinyl is playing
  const frontBarrierZ = isPlaying ? FRONT_BARRIER_PLAYING_Z : FRONT_BARRIER_DEFAULT_Z
  const resolvedTopY = isPlaying ? (topYPlaying ?? 3) : (topY ?? 8)
  return (
    <>
      {/* Top wall - Lower when vinyl is visible to keep orbs below vinyl */}
      {/* Vinyl is at Y=5, so top barrier at Y=3 keeps orbs in the center area */}
      <RigidBody type="fixed" position={[0, resolvedTopY, 0]} key={`top-${resolvedTopY}`}>
        <CuboidCollider args={[size, 0.5, depth]} restitution={0.7} friction={0.1} />
      </RigidBody>

      {/* Bottom wall - Match container edge */}
      <RigidBody type="fixed" position={[0, -13, 0]}>
        <CuboidCollider args={[size, 0.5, depth]} />
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed" position={[-20, 0, 0]}>
        <CuboidCollider args={[0.5, size, depth]} />
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" position={[20, 0, 0]}>
        <CuboidCollider args={[0.5, size, depth]} />
      </RigidBody>
      
      {/* Front wall - keep orbs from going too far forward */}
      {/* When playing, this barrier moves back to keep orbs behind the vinyl */}
      <RigidBody type="fixed" position={[0, 0, frontBarrierZ]} key={`front-${frontBarrierZ}`}>
        <CuboidCollider args={[size, size, 0.5]} restitution={0.8} friction={0.1} />
      </RigidBody>
      
      {/* Back wall - keep orbs from going too far back */}
      <RigidBody type="fixed" position={[0, 0, -50]}>
        <CuboidCollider args={[size, size, 0.5]} />
      </RigidBody>
    </>
  )
}
