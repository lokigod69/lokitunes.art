// Changes: Smooth mouse attraction strength ramp (speed+accel smoothing) to avoid orb chaos and reduce idle jitter (2025-12-24)
'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { memo, useRef } from 'react'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { applyAttractorForceOnRigidBody } from '@react-three/rapier-addons'

/**
 * Mouse attraction component - INVISIBLE VERSION
 * Tracks mouse and applies physics force to orbs
 * No visual elements - just pure attraction physics
 * 
 * @param albumCount - Number of orbs/versions (used to scale attraction for large albums)
 */
// Wrap in React.memo to prevent infinite re-renders!
function MouseAttractionComponent({ albumCount }: { albumCount?: number }) {
  const { camera, pointer } = useThree()
  const { world } = useRapier()
  const attractorObject = useRef<THREE.Object3D>(null)
  const frameCount = useRef(0)
  const lastPointer = useRef({ x: 0, y: 0 })
  const smoothedSpeed = useRef(0)
  const smoothedAccel = useRef(0)
  const lastSpeed = useRef(0)
  
  // Movement threshold - ignore tiny mouse movements to keep orbs calmer
  const MOVEMENT_THRESHOLD = 0.0035  // Minimum pointer delta to trigger force
  
  // Dynamic attraction settings based on album size
  // Range scales with album size (larger albums need longer reach)
  // INCREASED BASE RANGE: Platypus orbs are 26+ units away, old range of 20 was too small!
  const attractorRange = !albumCount ? 35 :
                         albumCount > 20 ? 60 :   // Very large (25+ orbs)
                         albumCount > 15 ? 50 :   // Large (16-20 orbs)
                         albumCount > 10 ? 40 :   // Medium (11-15 orbs)
                         35                       // Small (≤10 orbs) - INCREASED from 20 to 35!
  
  // FIX 2: Consistent strength for all album sizes (was scaled 100-300, penalizing small albums)
  // FIX M1: 20% boost for touch devices (less precise input needs stronger attraction)
  // FIX: Increased desktop strength for more responsive physics
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window
  const baseStrength = 220
  const attractorStrength = isTouchDevice ? baseStrength * 0.8 : baseStrength
  
  useFrame((_state, delta) => {
    frameCount.current++

    // Calculate mouse movement delta
    const deltaX = pointer.x - lastPointer.current.x
    const deltaY = pointer.y - lastPointer.current.y
    const movementDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Update last position
    lastPointer.current = { x: pointer.x, y: pointer.y }

    // Convert 2D mouse pointer to 3D world position
    const vector = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vector.unproject(camera)
    const dir = vector.sub(camera.position).normalize()
    const distance = 15
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance))

    if (!attractorObject.current) return
    attractorObject.current.position.set(targetPos.x, targetPos.y, targetPos.z)

    const dt = Math.max(delta, 1 / 120)
    const speed = movementDelta / dt
    const accel = (speed - lastSpeed.current) / dt
    lastSpeed.current = speed

    const smoothing = 1 - Math.exp(-dt * 12)
    smoothedSpeed.current = smoothedSpeed.current + (speed - smoothedSpeed.current) * smoothing
    smoothedAccel.current = smoothedAccel.current + (Math.abs(accel) - smoothedAccel.current) * smoothing

    // Skip force application if mouse barely moved (keeps orbs calm)
    if (movementDelta < MOVEMENT_THRESHOLD) {
      // Decay smoothed metrics so the next motion ramps in gently.
      smoothedSpeed.current *= 0.92
      smoothedAccel.current *= 0.92
      return
    }

    // Speed- and acceleration-driven scaling.
    // This makes orbs follow smoothly at slow movement, and only ramp strongly when the cursor accelerates.
    const SPEED_FULL = 4.0
    const ACCEL_FULL = 40.0
    const speedScale = Math.min(smoothedSpeed.current / SPEED_FULL, 1)
    const accelScale = Math.min(smoothedAccel.current / ACCEL_FULL, 1)
    const movementScale = Math.min(1, speedScale * 0.7 + accelScale * 0.3)

    // Baseline strength once moving, then ramp up with speed/accel.
    const scaledStrength = attractorStrength * (0.2 + 0.8 * movementScale)

    const object = attractorObject.current

    world.bodies.forEach((body: any) => {
      if (!body.isDynamic()) return
      applyAttractorForceOnRigidBody(body, {
        object,
        strength: scaledStrength,
        range: attractorRange,
        type: 'linear',
        gravitationalConstant: 6.673e-11,
      })
    })
  })
  
  return (
    <object3D ref={attractorObject} />
  )
}

// Export memoized version to prevent re-renders
export const MouseAttraction = memo(MouseAttractionComponent)
